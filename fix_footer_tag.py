#!/usr/bin/env python3
"""Restore corrupted footer opening tags after mobile bar removal."""

from pathlib import Path

ROOT = Path(__file__).parent.resolve()
BROKEN = ' itemtype="https://schema.org/WPFooter" itemscope="itemscope" id="colophon" role="contentinfo">'
FIXED = '<footer itemtype="https://schema.org/WPFooter" itemscope="itemscope" id="colophon" role="contentinfo">'


def main():
    n = 0
    for path in ROOT.rglob("*.html"):
        text = path.read_text(encoding="utf-8", errors="replace")
        if BROKEN not in text:
            continue
        text = text.replace(BROKEN, FIXED)
        path.write_text(text, encoding="utf-8")
        n += 1
    print(f"Fixed footer tag on {n} pages")


if __name__ == "__main__":
    main()
