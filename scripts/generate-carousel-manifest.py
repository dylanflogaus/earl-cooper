#!/usr/bin/env python3
"""
Scan assets/img/carousel/ and write manifest.json for the commitment page carousel.

Run after adding or removing images in that folder, then commit manifest.json:

    python3 scripts/generate-carousel-manifest.py
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAROUSEL_DIR = ROOT / "assets" / "img" / "carousel"
MANIFEST_PATH = CAROUSEL_DIR / "manifest.json"

IMAGE_SUFFIXES = {".webp", ".jpg", ".jpeg", ".png", ".gif", ".avif"}


def dims_from_name(name: str) -> tuple[int, int]:
    m = re.search(r"w_(\d+),h_(\d+)", name)
    if m:
        return int(m.group(1)), int(m.group(2))
    m = re.search(r"w_(\d+)", name)
    if m:
        ww = int(m.group(1))
        return ww, max(400, int(ww * 0.65))
    return 1200, 800


def sort_key(name: str) -> tuple:
    if name == "rs=w_1280,h_854.webp":
        return (0, name.lower())
    if name.startswith("rs=w_1280"):
        return (1, name.lower())
    if re.match(r"^\d+rs=w_1280,h_854", name):
        return (2, name.lower())
    if "w_1280" in name:
        return (3, name.lower())
    if "w_1160" in name or "w_984" in name:
        return (4, name.lower())
    if "w_600" in name:
        return (5, name.lower())
    if "w_365" in name:
        return (6, name.lower())
    return (7, name.lower())


def main() -> None:
    if not CAROUSEL_DIR.is_dir():
        raise SystemExit(f"Missing carousel directory: {CAROUSEL_DIR}")

    files: list[str] = []
    for p in CAROUSEL_DIR.iterdir():
        if not p.is_file():
            continue
        if p.name == "manifest.json":
            continue
        if p.name.startswith("."):
            continue
        if p.suffix.lower() not in IMAGE_SUFFIXES:
            continue
        files.append(p.name)

    files = sorted(set(files), key=sort_key)

    images = []
    for name in files:
        w, h = dims_from_name(name)
        images.append({"file": name, "width": w, "height": h})

    payload = {
        "version": 1,
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "images": images,
    }

    MANIFEST_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(images)} entries to {MANIFEST_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
