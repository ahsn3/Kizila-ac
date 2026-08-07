#!/usr/bin/env python3
"""Remove duplicate elementor-47 mobile bar before #colophon."""

import re
from pathlib import Path

ROOT = Path(__file__).parent.resolve()
PATTERN = re.compile(
    r"<div class='footer-width-fixer'>\s*"
    r'<div data-elementor-type="wp-post" data-elementor-id="47" class="elementor elementor-47".*?'
    r"</div>\s*</div>\s*<footer",
    re.DOTALL,
)


def main():
    n = 0
    for path in ROOT.rglob("*.html"):
        text = path.read_text(encoding="utf-8", errors="replace")
        new = PATTERN.sub("\n", text, count=1)
        if new != text:
            path.write_text(new, encoding="utf-8")
            n += 1
    print(f"Removed mobile bar from {n} pages")


if __name__ == "__main__":
    main()
