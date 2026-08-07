#!/usr/bin/env python3
"""Merge projects page 2 into page 1 and remove pagination."""

import re
from pathlib import Path

ROOT = Path(__file__).parent.resolve()

PAIRS = [
    (ROOT / "projeler" / "index.html", ROOT / "projeler" / "2" / "index.html"),
    (ROOT / "en" / "projects" / "index.html", ROOT / "en" / "projects" / "2" / "index.html"),
]


def extract_loop_items(html: str) -> str:
    items = re.findall(
        r'(<div data-elementor-type="loop-item"[^>]*class="[^"]*e-loop-item-\d+[^"]*"[\s\S]*?'
        r'</div>\s*</div>\s*</div>)(?=\s*(?:<div data-elementor-type="loop-item"|'
        r'\s*</div>\s*\n\s*<div class="e-load-more-anchor"))',
        html,
    )
    if not items:
        raise RuntimeError("No loop items found")
    block = "\n\t\t\t\t".join(items)
    block = re.sub(r"(?:\.\./)+wp-content/", "../wp-content/", block)
    block = re.sub(r"https?://kizilagacinsaat\.com/wp-content/", "../wp-content/", block)
    return block


def merge_page(main_path: Path, extra_path: Path) -> None:
    main = main_path.read_text(encoding="utf-8")
    extra = extra_path.read_text(encoding="utf-8")
    items = extract_loop_items(extra)

    main = re.sub(
        r"(\s*)</div>\s*\n\s*<div class=\"e-load-more-anchor\"",
        r"\1" + items + r"\n\1</div>\n\1\t\t<div class=\"e-load-more-anchor\"",
        main,
        count=1,
        flags=re.S,
    )

    main = re.sub(r'\s*<div class="e-load-more-anchor"[^>]*></div>\s*', "\n", main)
    main = re.sub(
        r'\s*<nav class="elementor-pagination"[^>]*>.*?</nav>\s*',
        "\n",
        main,
        count=1,
        flags=re.S,
    )

    main_path.write_text(main, encoding="utf-8")
    print(f"Merged {extra_path.relative_to(ROOT)} into {main_path.relative_to(ROOT)}")


def main() -> None:
    for main_path, extra_path in PAIRS:
        if not extra_path.exists():
            raise SystemExit(f"Missing {extra_path}")
        merge_page(main_path, extra_path)
        extra_path.unlink()
        page_dir = extra_path.parent
        if page_dir.exists() and not any(page_dir.iterdir()):
            page_dir.rmdir()


if __name__ == "__main__":
    main()
