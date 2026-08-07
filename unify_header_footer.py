#!/usr/bin/env python3
"""Replace subpage header/footer with homepage versions (TR + EN)."""

import re
from pathlib import Path

ROOT = Path(__file__).parent.resolve()

HEADER_RE = re.compile(
    r"<header\b[^>]*elementor-location-header[^>]*>.*?</header>",
    re.DOTALL | re.IGNORECASE,
)
FOOTER_RE = re.compile(
    r'<footer\b[^>]*id="colophon"[^>]*>.*?</footer>',
    re.DOTALL | re.IGNORECASE,
)


def extract_block(text, pattern):
    m = pattern.search(text)
    if not m:
        raise ValueError("Block not found")
    return m.group(0)


def path_prefix(fpath: Path, is_en: bool) -> str:
    rel = fpath.parent.relative_to(ROOT)
    parts = rel.parts
    if parts == ():
        return ""
    if is_en:
        depth = len(parts) - 1 if parts and parts[0] == "en" else len(parts)
    else:
        depth = len(parts)
    return "../" * depth if depth else ""


def adjust_paths(html: str, prefix: str) -> str:
    if not prefix:
        return html

    def repl(m):
        attr, val = m.group(1), m.group(2)
        if val.startswith(("http://", "https://", "#", "mailto:", "tel:", "javascript:", "data:")):
            return m.group(0)
        if val.startswith("../") or val.startswith("./"):
            return m.group(0)
        return f'{attr}="{prefix}{val}"'

    return re.sub(r'(href|src)="([^"]+)"', repl, html)


def strip_active_menu(html: str) -> str:
    html = re.sub(r"\s*current-menu-item", "", html)
    html = re.sub(r"\s*current_page_item", "", html)
    html = re.sub(r"\s*page_item", "", html)
    return html


def fix_head_css(text: str, prefix: str) -> str:
    text = re.sub(
        r"<link[^>]*id=['\"]elementor-post-11098-css['\"][^>]*>",
        "",
        text,
        flags=re.I,
    )

    for post_id, css_name in (("10968", "post-10968.css"), ("46", "post-46.css")):
        css_path = f"{prefix}wp-content/uploads/elementor/css/{css_name}"
        link_id = f"elementor-post-{post_id}-css"
        if css_name not in text:
            link = (
                f"<link rel='stylesheet' id='{link_id}' "
                f"href='{css_path}' media='all' />"
            )
            text = text.replace("</head>", f"{link}\n</head>", 1)
        else:
            text = re.sub(
                rf"(<link[^>]*id=['\"]{link_id}['\"][^>]*href=['\"])[^'\"]+(['\"])",
                rf"\1{css_path}\2",
                text,
                count=1,
                flags=re.I,
            )
    return text


def is_en_page(fpath: Path) -> bool:
    rel = fpath.relative_to(ROOT)
    return rel.parts and rel.parts[0] == "en"


def main():
    tr_src = (ROOT / "index.html").read_text(encoding="utf-8", errors="replace")
    en_src = (ROOT / "en/index.html").read_text(encoding="utf-8", errors="replace")

    tr_header = strip_active_menu(extract_block(tr_src, HEADER_RE))
    tr_footer = extract_block(tr_src, FOOTER_RE)
    en_header = strip_active_menu(extract_block(en_src, HEADER_RE))
    en_footer = extract_block(en_src, FOOTER_RE)

    changed = 0
    for fpath in ROOT.rglob("*.html"):
        if fpath in {ROOT / "index.html", ROOT / "en/index.html"}:
            continue

        text = fpath.read_text(encoding="utf-8", errors="replace")
        orig = text
        en = is_en_page(fpath)
        prefix = path_prefix(fpath, en)

        header_tpl = en_header if en else tr_header
        footer_tpl = en_footer if en else tr_footer

        new_header = adjust_paths(header_tpl, prefix)
        new_footer = adjust_paths(footer_tpl, prefix)

        text = HEADER_RE.sub(new_header, text, count=1)
        text = FOOTER_RE.sub(new_footer, text, count=1)
        text = fix_head_css(text, prefix)

        if text != orig:
            fpath.write_text(text, encoding="utf-8")
            changed += 1

    print(f"Unified header/footer on {changed} pages")


if __name__ == "__main__":
    main()
