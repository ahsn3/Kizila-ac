#!/usr/bin/env python3
"""Generate static page 2 for projects listing (TR + EN)."""

import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).parent.resolve()

PAGES = [
    {
        "source": ROOT / "projeler" / "index.html",
        "dest": ROOT / "projeler" / "2" / "index.html",
        "wp_url": "https://kizilagacinsaat.com/projeler/2/",
        "canonical": "https://kizilagac.netlify.app/projeler/2/",
        "og_url": "https://kizilagac.netlify.app/projeler/2/",
        "page_num": 2,
        "pagination_prev": "../index.html",
        "pagination_next": None,
    },
    {
        "source": ROOT / "en" / "projects" / "index.html",
        "dest": ROOT / "en" / "projects" / "2" / "index.html",
        "wp_url": "https://kizilagacinsaat.com/en/projects/2/",
        "canonical": "https://kizilagac.netlify.app/en/projects/2/",
        "og_url": "https://kizilagac.netlify.app/en/projects/2/",
        "page_num": 2,
        "pagination_prev": "../index.html",
        "pagination_next": None,
    },
]


def fetch_loop_html(url: str) -> str:
    result = subprocess.run(
        ["curl", "-sL", url],
        check=True,
        capture_output=True,
        text=True,
    )
    html = result.stdout
    start = html.find('<div class="elementor-loop-container elementor-grid" role="list">')
    end = html.find('<div class="e-load-more-anchor"')
    if start == -1 or end == -1:
        raise RuntimeError(f"Could not find projects loop on {url}")
    return html[start:end]


def deepen_relative_paths(text: str) -> str:
    """One directory deeper: ../foo -> ../../foo"""
    text = text.replace('href="../', 'href="../../')
    text = text.replace("href='../", "href='../../")
    text = text.replace('src="../', 'src="../../')
    text = text.replace("src='../", "src='../../")
    text = text.replace('url(../', 'url(../../')
    text = text.replace("url('../", "url('../../")
    text = text.replace('url("../', 'url("../../')
    return text


def fix_loop_paths(loop_html: str, prefix: str) -> str:
    loop_html = re.sub(r"https?://kizilagacinsaat\.com/", prefix, loop_html)
    loop_html = loop_html.replace('src="../', 'src="' + prefix)
    loop_html = loop_html.replace("src='../", "src='" + prefix)
    return loop_html


def replace_loop_container(page_html: str, loop_html: str) -> str:
    pattern = (
        r'(<div class="elementor-loop-container elementor-grid" role="list">)'
        r".*?"
        r'(</div>\s*\n\s*<div class="e-load-more-anchor")'
    )
    inner = loop_html.split('role="list">', 1)[1].strip()
    replacement = r"\1\n\t\t" + inner + r"\n\t\t\2"
    return re.sub(pattern, replacement, page_html, count=1, flags=re.S)


def build_pagination(page_num: int, prev_href: str, next_href, is_en: bool) -> str:
    label = "Page" if is_en else "Sayfa"
    prev_label = f'<span class="elementor-screen-only">{label}</span>'
    if page_num == 1:
        current = f'<span aria-current="page" class="page-numbers current">{prev_label}1</span>'
        nxt = f'<a class="page-numbers" href="{next_href}">{prev_label}2</a>'
        return f"{current}\n{nxt}"
    current = f'<span aria-current="page" class="page-numbers current">{prev_label}2</span>'
    prev = f'<a class="page-numbers" href="{prev_href}">{prev_label}1</a>'
    return f"{prev}\n{current}"


def build_page(cfg: dict) -> None:
    is_en = "/en/" in cfg["dest"].as_posix()
    prefix = "../../" if is_en else "../../"

    text = cfg["source"].read_text(encoding="utf-8")
    text = deepen_relative_paths(text)

    loop = fetch_loop_html(cfg["wp_url"])
    loop = fix_loop_paths(loop, prefix)
    text = replace_loop_container(text, loop)

    pagination = build_pagination(cfg["page_num"], cfg["pagination_prev"], cfg["pagination_next"], is_en)
    text = re.sub(
        r"<nav class=\"elementor-pagination\"[^>]*>.*?</nav>",
        f'<nav class="elementor-pagination" aria-label="{"Pagination" if is_en else "Sayfalandırma"}">\n\t\t\t{pagination}\t\t</nav>',
        text,
        count=1,
        flags=re.S,
    )

    text = re.sub(
        r'<div class="e-load-more-anchor"[^>]*>',
        f'<div class="e-load-more-anchor" data-page="{cfg["page_num"]}" data-max-page="2" data-next-page="">',
        text,
        count=1,
    )

    text = text.replace(
        'href="index.html"',
        'href="index.html"',
    )
    text = re.sub(r'<link rel="canonical" href="[^"]*" />', f'<link rel="canonical" href="{cfg["canonical"]}" />', text)
    text = re.sub(r'<meta property="og:url" content="[^"]*" />', f'<meta property="og:url" content="{cfg["og_url"]}" />', text)
    text = re.sub(
        r"https://kizilagacinsaat\.com/projeler/?(?:2/)?",
        cfg["canonical"].rstrip("/") + "/",
        text,
    )
    text = re.sub(
        r"https://kizilagacinsaat\.com/en/projects/?(?:2/)?",
        cfg["canonical"].rstrip("/") + "/",
        text,
    )

    cfg["dest"].parent.mkdir(parents=True, exist_ok=True)
    cfg["dest"].write_text(text, encoding="utf-8")
    print(f"Wrote {cfg['dest'].relative_to(ROOT)}")


def main() -> None:
    for cfg in PAGES:
        build_page(cfg)


if __name__ == "__main__":
    main()
