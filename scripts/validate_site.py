#!/usr/bin/env python3
"""Validate the static site's local references without network access or dependencies."""

import argparse
import re
import struct
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
errors = []


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.ids = set()
        self.refs = []
        self.idrefs = []
        self.metadata = {}
        self.canonical = None
        self.language = None
        self.titles = 0
        self.feed(path.read_text())

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        element_id = attrs.get("id")
        if element_id:
            if element_id in self.ids:
                errors.append(f"{self.path.name}: duplicate ID {element_id}")
            self.ids.add(element_id)
        for attribute in ("aria-controls", "aria-labelledby", "aria-describedby"):
            self.idrefs.extend((attrs.get(attribute) or "").split())
        for attribute in ("href", "src", "poster"):
            if attrs.get(attribute) is not None:
                self.refs.append(attrs[attribute])
        if tag == "html":
            self.language = attrs.get("lang")
        if tag == "title":
            self.titles += 1
        if tag == "meta":
            self.metadata[attrs.get("name") or attrs.get("property")] = attrs.get("content", "")
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonical = attrs.get("href")
        if tag == "img" and "alt" not in attrs:
            errors.append(f"{self.path.name}: image is missing an alt attribute")

    handle_startendtag = handle_starttag


def check_reference(source, reference, canonical):
    url = urlsplit(reference)
    if not reference or reference == "#":
        errors.append(f"{source.name}: empty destination")
        return
    if url.scheme or url.netloc:
        if reference.startswith(canonical):
            relative = reference[len(canonical):]
            url = urlsplit(relative)
            target = PUBLIC / unquote(url.path)
        else:
            return
    elif url.path.startswith("/"):
        errors.append(f"{source.name}: root-relative URL breaks project hosting: {reference}")
        return
    else:
        target = source.parent / unquote(url.path) if url.path else source
    if target.is_dir():
        target /= "index.html"
    target = target.resolve()
    if not target.is_relative_to(PUBLIC):
        errors.append(f"{source.name}: reference leaves public/: {reference}")
    elif not target.is_file():
        errors.append(f"{source.name}: missing file for {reference}")
    elif url.fragment and target.suffix == ".html":
        if unquote(url.fragment) not in pages[target].ids:
            errors.append(f"{source.name}: missing anchor for {reference}")


def markdown_anchors(text):
    return {
        re.sub(r"[^\w\- ]", "", line.lstrip("#").strip().lower()).replace(" ", "-")
        for line in text.splitlines() if line.startswith("#")
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--skill-directory", type=Path, help="Check linked skill documents and the launch and resume prompts against this checkout")
    args = parser.parse_args()
    canonical = pages[PUBLIC / "index.html"].canonical or ""
    if not canonical.startswith("https://") or not canonical.endswith("/"):
        errors.append("index.html: canonical must be an HTTPS directory URL")
        canonical = "https://invalid.local/"
    for path, page in pages.items():
        if page.language != "en":
            errors.append(f"{path.name}: expected English document language")
        if not page.titles or not page.metadata.get("description"):
            errors.append(f"{path.name}: missing title or description")
        expected = canonical + ("" if path.name == "index.html" else path.name)
        if page.canonical != expected:
            errors.append(f"{path.name}: inconsistent canonical URL")
        for ref in page.refs:
            check_reference(path, ref, canonical)
        for ref in page.idrefs:
            if ref not in page.ids:
                errors.append(f"{path.name}: unresolved accessibility reference {ref}")
        for key in ("og:image", "twitter:image"):
            if key in page.metadata:
                check_reference(path, page.metadata[key], canonical)
    for path in PUBLIC.rglob("*.css"):
        for ref in re.findall(r"url\(['\"]?([^)'\"]+)", path.read_text()):
            if not ref.startswith(("data:", "#")):
                check_reference(path, ref, canonical)
    for path in [*PUBLIC.rglob("*.svg"), PUBLIC / "sitemap.xml"]:
        try:
            ElementTree.parse(path)
        except ElementTree.ParseError as error:
            errors.append(f"{path.name}: invalid XML: {error}")
    try:
        sitemap = ElementTree.parse(PUBLIC / "sitemap.xml")
        for loc in sitemap.findall(".//{*}loc"):
            check_reference(PUBLIC / "index.html", loc.text or "", canonical)
    except ElementTree.ParseError:
        pass  # The XML validation above already reports the parse error.
    if f"Sitemap: {canonical}sitemap.xml" not in (PUBLIC / "robots.txt").read_text():
        errors.append("robots.txt: sitemap does not match canonical address")
    preview = PUBLIC / "assets/og-image.png"
    if preview.is_file():
        header = preview.read_bytes()[:24]
        if len(header) < 24 or header[:8] != b"\x89PNG\r\n\x1a\n" or struct.unpack(">II", header[16:24]) != (1200, 630):
            errors.append("og-image.png: expected a 1200 × 630 PNG")
    sources = "\n".join(path.read_text() for path in [ROOT / "README.md", PUBLIC / "index.html"])
    versions = set(re.findall(r"\bv\d+\.\d+\.\d+\b", sources))
    if len(versions) != 1:
        errors.append(f"Website release references disagree: {sorted(versions)}")
    index = (PUBLIC / "index.html").read_text()
    script = (PUBLIC / "assets/site.js").read_text()
    prompts = {}
    for name in ("launch", "resume"):
        prompt = re.search(rf"const {name}Text = '(.*?)';", script)
        if not prompt or f'<p id="{name}-prompt">$stn-ultradesign {prompt[1]}</p>' not in index:
            errors.append(f"{name.capitalize()} prompt differs between static HTML and client switching")
        if prompt:
            prompts[name] = prompt[1]
    if args.skill_directory:
        skill = args.skill_directory.resolve()
        skill_readme = (skill / "README.md").read_text()
        for name, prompt in prompts.items():
            if f"> $stn-ultradesign {prompt}\n" not in skill_readme:
                errors.append(f"{name.capitalize()} prompt differs from the skill README")
        for ref in pages[PUBLIC / "index.html"].refs:
            match = re.match(r"https://github.com/sthiermann/stn-ultradesign/blob/v[\d.]+/([^#]+)(?:#(.*))?$", ref)
            if not match:
                continue
            document = skill / match[1]
            if not document.is_file():
                errors.append(f"Skill documentation does not exist: {match[1]}")
            elif match[2] and match[2] not in markdown_anchors(document.read_text()):
                errors.append(f"Skill documentation anchor does not exist: {match[1]}#{match[2]}")
        skill_versions = set(re.findall(r"Release \*\*v(\d+\.\d+\.\d+)\*\*", (skill / "README.md").read_text()))
        if {f"v{version}" for version in skill_versions} != versions:
            errors.append("Website version differs from the skill README")
    if errors:
        print("Validation failed:\n" + "\n".join(f"- {error}" for error in errors))
        return 1
    print(f"Validated {len(pages)} HTML pages, local assets, anchors, accessibility references, metadata and release consistency.")
    print("External URL availability and browser behavior require separate review.")
    return 0


pages = {path.resolve(): Page(path) for path in PUBLIC.rglob("*.html")}
if __name__ == "__main__":
    sys.exit(main())
