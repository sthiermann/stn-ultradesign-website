# STN Ultradesign website

The public website for **STN Ultradesign**, an AI UI/UX design skill for Codex and Claude Code. It introduces the workflow, demonstrates how requirements become an interface, and provides installation instructions.

[Website](https://sthiermann.github.io/stn-ultradesign-website/) · [Skill repository](https://github.com/sthiermann/stn-ultradesign) · [Skill installation](https://github.com/sthiermann/stn-ultradesign/blob/v0.6.1/docs/installation.md)

The website currently presents skill release **v0.6.1**. The [skill README](https://github.com/sthiermann/stn-ultradesign/blob/v0.6.1/README.md) and installation documentation are the source of truth for installation commands and launch prompts. This repository contains the website, not the installable skill.

## Run locally

No package installation or build step is required. With Python 3 installed, run from the repository root:

```sh
python3 -m http.server 8770 --directory public
```

Open `http://localhost:8770/`. Serve `public/` as the document root; all page assets use relative paths so the site also works under its GitHub Pages project path.

## Structure

- `public/index.html` — the main page, interactive demonstrations and installation copy.
- `public/privacy.html` — an explanation of local display preferences and hosting.
- `public/assets/` — local styles, scripts, identity assets and social preview.
- `public/robots.txt` and `public/sitemap.xml` — crawler configuration.
- `scripts/validate_site.py` — local link, asset, metadata and accessibility-reference checks.
- `.github/workflows/pages.yml` — validation and GitHub Pages deployment.

The site uses native HTML, CSS, JavaScript and inline SVG. There are no third-party runtime libraries, external web fonts or analytics. Light and dark appearances default to the system setting. The appearance and motion preferences are saved locally when browser storage is available. Scroll chapters also work through keyboard-accessible controls; reduced-motion settings use a manual presentation. Installation information remains available when JavaScript is disabled.

## Validate a change

```sh
python3 scripts/stamp_assets.py
python3 scripts/validate_site.py
node --check public/assets/appearance.js
node --check public/assets/site.js
node --check public/assets/journey.js
node --check public/assets/experience.js
```

If a checkout of the skill repository is available, also compare the pinned documentation links and launch prompt against it:

```sh
python3 scripts/validate_site.py --skill-directory ../stn-ultradesign
```

The validator does not replace browser review. Check desktop and mobile, both themes, keyboard navigation, reduced motion, the manual motion control, every scroll chapter and both installation paths after visual or interaction changes. Check the social image at `public/assets/og-image.png` whenever its editable SVG changes.

After changing a CSS, JavaScript or image asset, refresh its cache key with `python3 scripts/stamp_assets.py` before validation and publication.

## Deploy

The workflow publishes only `public/` to GitHub Pages after validation. It runs checks on pull requests and deploys successful pushes to `main`; it can also be started manually on `main`.

In the repository's **Settings → Pages**, select **GitHub Actions** as the build and deployment source. The workflow uses the `github-pages` environment and the standard Pages deployment permissions. Action versions are pinned to verified commit hashes.

The canonical address is `https://sthiermann.github.io/stn-ultradesign-website/`. If the hosting address changes, update the canonical links and social metadata in the HTML, `robots.txt`, `sitemap.xml` and this README together.

When advancing the skill release, update all pinned installation and documentation links, visible version labels and this README. Confirm the new skill tag exists before deploying those links. Keep the visible prompt in `index.html` and the client-switching prompt in `site.js` consistent with the skill README.

## License and brand

Website code and documentation are available under the [MIT license](LICENSE). Reserved identity assets are covered separately by the [asset rights notice](public/assets/LICENSE) and [brand notice](TRADEMARKS.md). The installable STN Ultradesign skill remains MIT licensed.

The approved ST monogram and new branded presentation artwork are reserved to **Sven Thiermann**. The MIT grant does not license the monogram, the favicon, the social preview artwork or their embedded copies in the HTML and SVG. See [TRADEMARKS.md](TRADEMARKS.md) for scope. Reusing the website code does not grant rights to reuse this personal identity or imply endorsement.
