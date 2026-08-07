#!/usr/bin/env python3
"""Final HTML patches: slider images, SR7 config, static-fix injection."""

import re
from pathlib import Path

ROOT = Path(__file__).parent.resolve()


def depth_rel(from_dir):
    depth = len(from_dir.relative_to(ROOT).parts)
    return "../" * depth + "static-fix.js" if depth else "static-fix.js"


def fix_slider_noscript(text):
    def repl(m):
        src = m.group(1)
        alt = m.group(2) or ""
        title = m.group(3) or ""
        return (
            f'<img decoding="async" src="{src}" alt="{alt}" title="{title}" '
            f'style="width:100%;height:100%;object-fit:cover;display:block;position:absolute;inset:0;">'
        )
    text = re.sub(
        r'<noscript>\s*<img decoding="async" src="([^"]+)" alt="([^"]*)" title="([^"]*)">\s*</noscript>',
        repl,
        text,
    )
    return text


def patch_file(fpath):
    text = fpath.read_text(encoding="utf-8", errors="replace")
    orig = text

    text = fix_slider_noscript(text)

    text = text.replace("https://kizilagacinsaat.com/wp-content/plugins/revslider/", "wp-content/plugins/revslider/")
    text = text.replace("http://kizilagacinsaat.com/wp-content/plugins/", "wp-content/plugins/")
    text = text.replace("https://kizilagacinsaat.com/wp-content/plugins/", "wp-content/plugins/")
    text = text.replace("SR7.E.ajaxurl\t\t= 'https://kizilagacinsaat.com/wp-admin/admin-ajax.php'", "SR7.E.ajaxurl\t\t= ''")
    text = text.replace("SR7.E.resturl\t\t= 'https://kizilagacinsaat.com/wp-json/'", "SR7.E.resturl\t\t= ''")
    text = text.replace('"//kizilagacinsaat.com/wp-content/plugins/revslider/', '"wp-content/plugins/revslider/')
    text = text.replace('"\\/\\/kizilagacinsaat.com\\/wp-content\\/plugins\\/revslider/', '"wp-content/plugins/revslider/')

    # Remove duplicate static-fix tags
    text = re.sub(r'(<script src="[^"]*static-fix\.js"></script>\s*)+', '', text)
    rel = depth_rel(fpath.parent)
    if "</body>" in text:
        text = text.replace("</body>", f'<script src="{rel}"></script>\n</body>')

    if text != orig:
        fpath.write_text(text, encoding="utf-8")
        return True
    return False


def main():
    n = 0
    for f in ROOT.rglob("*.html"):
        if patch_file(f):
            n += 1
    print(f"Patched {n} files")


if __name__ == "__main__":
    main()
