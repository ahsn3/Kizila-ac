#!/usr/bin/env python3
"""Clean rebuild: keep wp-content assets, re-download pages, convert links, fetch missing assets."""

import os
import re
import shutil
import ssl
import time
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).parent.resolve()
BASE = "https://kizilagacinsaat.com"
SITEMAPS = [f"{BASE}/page-sitemap.xml", f"{BASE}/service-sitemap.xml", f"{BASE}/project-sitemap.xml", f"{BASE}/post-sitemap.xml"]
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE
HEADERS = {"User-Agent": "Mozilla/5.0"}
ASSET_EXT = {".css", ".js", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".woff", ".woff2", ".ttf", ".eot", ".ico", ".mp4", ".pdf", ".json"}
KEEP_SCRIPTS = {"rebuild.py", "netlify.toml"}


def fetch(url, text=False):
    try:
        with urlopen(Request(url, headers=HEADERS), context=CTX, timeout=30) as r:
            d = r.read()
            return d.decode("utf-8", errors="replace") if text else d
    except Exception as e:
        print(f"  FAIL {url}: {e}")
        return None


def url_to_path(url):
    from urllib.parse import urlparse
    p = urlparse(url)
    path = p.path.rstrip("/").lstrip("/")
    if not path:
        return ROOT / "index.html"
    if "." not in os.path.basename(path):
        return ROOT / path / "index.html"
    return ROOT / path


def cleanup():
    print("=== Cleaning corrupted files ===")
    for item in ROOT.iterdir():
        if item.name in KEEP_SCRIPTS or item.name == "wp-content" or item.name == "wp-includes":
            continue
        if item.is_dir():
            shutil.rmtree(item, ignore_errors=True)
        elif item.suffix in (".html", ".py", ".sh") and item.name not in KEEP_SCRIPTS:
            item.unlink(missing_ok=True)
    # Remove junk inside wp-content if any
    for bad in ROOT.rglob("*"):
        if bad.is_file() and ("?" in bad.name or bad.name.endswith(".tmp")):
            bad.unlink(missing_ok=True)


def download_pages():
    urls = set()
    for sm in SITEMAPS:
        data = fetch(sm, text=True)
        if data:
            root = ET.fromstring(data)
            for el in root.iter():
                if el.tag.endswith("loc") and el.text:
                    urls.add(el.text.strip())
    urls = sorted(urls)
    print(f"\n=== Downloading {len(urls)} pages ===")
    for i, url in enumerate(urls, 1):
        path = url_to_path(url)
        print(f"  [{i}/{len(urls)}] {path.relative_to(ROOT)}")
        data = fetch(url)
        if data:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
        time.sleep(0.15)


def make_relative(url, from_dir):
    url = url.replace("&amp;", "&").strip()
    if not url or url.startswith(("#", "data:", "mailto:", "tel:", "javascript:")):
        return url
    if url.startswith("http") and "kizilagacinsaat.com" not in url:
        return url
    local = None
    if url.startswith("//") and "kizilagacinsaat.com" in url:
        p = url.split("kizilagacinsaat.com", 1)[1].split("?")[0].split("#")[0].lstrip("/")
    elif url.startswith(("http://", "https://")) and "kizilagacinsaat.com" in url:
        p = url.split("kizilagacinsaat.com", 1)[1].split("?")[0].split("#")[0].lstrip("/")
    elif url.startswith("/"):
        p = url.split("?")[0].split("#")[0].lstrip("/")
    else:
        return url
    local = "index.html" if not p else (p + "/index.html" if "." not in os.path.basename(p) else p)
    try:
        return os.path.relpath(ROOT / local, from_dir).replace("\\", "/")
    except ValueError:
        return local


def convert_links():
    print("\n=== Converting links ===")
    n = 0
    for f in ROOT.rglob("*.html"):
        if f.name in KEEP_SCRIPTS:
            continue
        try:
            text = f.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        orig = text
        base = f.parent

        def sub(m):
            return f'{m.group(1)}{m.group(2)}{m.group(3)}{make_relative(m.group(4), base)}{m.group(3)}'

        text = re.sub(
            r'(href|src|action|data-src|data-lazy-src|poster)\s*(=)\s*(["\'])((?:https?://(?:www\.)?kizilagacinsaat\.com|//kizilagacinsaat\.com)[^"\']+|/(?!/)[^"\']+)\3',
            sub, text, flags=re.I,
        )
        text = re.sub(
            r'url\s*\(\s*["\']?((?:https?://(?:www\.)?kizilagacinsaat\.com|//kizilagacinsaat\.com)[^"\')\s]+|/(?!/)[^"\')\s]+)["\']?\s*\)',
            lambda m: f'url("{make_relative(m.group(1), base)}")', text, flags=re.I,
        )
        if text != orig:
            f.write_text(text, encoding="utf-8")
            n += 1
    for f in ROOT.rglob("*.css"):
        try:
            text = f.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        orig = text
        base = f.parent
        text = re.sub(
            r'url\s*\(\s*["\']?((?:https?://(?:www\.)?kizilagacinsaat\.com|//kizilagacinsaat\.com)[^"\')\s]+|/(?!/)[^"\')\s]+)["\']?\s*\)',
            lambda m: f'url("{make_relative(m.group(1), base)}")', text, flags=re.I,
        )
        if text != orig:
            f.write_text(text, encoding="utf-8")
            n += 1
    print(f"  Updated {n} files")


def download_assets():
    print("\n=== Downloading missing assets ===")
    refs = set()
    pat = re.compile(r'''(?:href|src|data-src|data-lazy-src|poster)\s*=\s*["']([^"']+)["']|url\s*\(\s*["']?([^"')]+)["']?\s*\)''', re.I)
    for f in ROOT.rglob("*"):
        if f.suffix.lower() not in {".html", ".css"}:
            continue
        try:
            text = f.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        for m in pat.finditer(text):
            u = (m.group(1) or m.group(2) or "").replace("&amp;", "&").split("?")[0].split("#")[0]
            if not u or u.startswith(("data:", "#", "mailto:", "tel:", "javascript:", "../", "http://unilancer", "https://www.", "https://fonts", "//fonts")):
                continue
            if u.startswith("http") and "kizilagacinsaat.com" not in u:
                continue
            if u.startswith("/"):
                u = u.lstrip("/")
            elif "kizilagacinsaat.com/" in u:
                u = u.split("kizilagacinsaat.com/", 1)[1]
            elif u.startswith("//") and "kizilagacinsaat.com/" in u:
                u = u.split("kizilagacinsaat.com/", 1)[1]
            ext = os.path.splitext(u)[1].lower()
            if ext in ASSET_EXT or u.startswith(("wp-content/", "wp-includes/")):
                refs.add(u)

    missing = sorted(r for r in refs if not (ROOT / r).exists() or (ROOT / r).stat().st_size == 0)
    print(f"  {len(missing)} missing assets")
    ok = 0
    for i, ref in enumerate(missing, 1):
        if i % 30 == 0:
            print(f"  [{i}/{len(missing)}] {ref}")
        data = fetch(f"{BASE}/{ref}")
        if data:
            p = ROOT / ref
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(data)
            ok += 1
        time.sleep(0.03)
    print(f"  Downloaded {ok} assets")


def main():
    cleanup()
    download_pages()
    convert_links()
    download_assets()
    pages = len(list(ROOT.rglob("index.html")))
    files = sum(1 for f in ROOT.rglob("*") if f.is_file())
    size = sum(f.stat().st_size for f in ROOT.rglob("*") if f.is_file()) / 1024 / 1024
    print(f"\n=== Done: {pages} pages, {files} files, {size:.1f} MB ===")


if __name__ == "__main__":
    main()
