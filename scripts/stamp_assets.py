#!/usr/bin/env python3
"""Refresh static asset cache keys after changing website assets."""
from hashlib import sha256
from pathlib import Path
import re

public = Path(__file__).resolve().parents[1] / 'public'
pattern = re.compile(r'(assets/[A-Za-z0-9_.-]+\.(?:css|js|svg|png))(?:\?v=[A-Za-z0-9.-]+)?(?=["\'])')

def stamp(match):
    asset = public / match.group(1)
    return match.group(1) + '?v=' + sha256(asset.read_bytes()).hexdigest()[:12]

for page in public.glob('*.html'):
    original = page.read_text()
    updated = pattern.sub(stamp, original)
    if updated != original:
        page.write_text(updated)
print('Static asset cache keys match current file contents.')
