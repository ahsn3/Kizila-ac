#!/usr/bin/env python3
"""Final HTML patches: slider images, SR7 config, static-fix injection."""

import re
from pathlib import Path

ROOT = Path(__file__).parent.resolve()
SITE_URL = "https://kizilagac.netlify.app"
OG_IMAGE = f"{SITE_URL}/og-share.jpg?v=2"
DEFAULT_DESC_TR = (
    "Kızılağaç İnşaat — uzun yıllara dayanan tecrübemizle İstanbul'da güvenilir, "
    "kaliteli ve anahtar teslim inşaat hizmetleri sunuyoruz."
)
DEFAULT_DESC_EN = (
    "Kızılağaç Construction — trusted turnkey residential and commercial "
    "building services in Istanbul with decades of experience."
)
LEGACY_DESC = "Tasarım, Veri, Koordinasyon, Bütünlük"
LEGACY_DESC_EN = "Design, Data, Coordination, Integrity"

BOOT_STYLE = """<style id="kiz-boot-css">/* kiz-boot v2 */
html:not(.kiz-ready){background-color:#f2f0eb}
html:not(.kiz-ready) body.home{background-color:#111}
html:not(.kiz-ready) body{overflow:hidden}
html:not(.kiz-ready) #page{opacity:0;visibility:hidden}
html.kiz-ready #page{opacity:1;visibility:visible;transition:opacity .5s cubic-bezier(.22,1,.36,1),visibility .5s ease}
html:not(.kiz-ready) sr7-slide{opacity:0!important;visibility:hidden!important;pointer-events:none!important}
html:not(.kiz-ready) sr7-module{background:#111}
@media (prefers-reduced-motion:reduce){html.kiz-ready #page{transition:none}}
</style>
"""


def depth_rel(from_dir):
    depth = len(from_dir.relative_to(ROOT).parts)
    return "../" * depth + "static-fix.js" if depth else "static-fix.js"


def wp_prefix(from_dir):
    depth = len(from_dir.relative_to(ROOT).parts)
    return "../" * depth if depth else ""


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


def is_en_page(fpath: Path) -> bool:
    rel = fpath.relative_to(ROOT)
    return bool(rel.parts) and rel.parts[0] == "en"


def page_public_url(fpath: Path) -> str:
    rel = fpath.relative_to(ROOT)
    parts = list(rel.parts)
    if parts and parts[-1] == "index.html":
        parts.pop()
    path = "/".join(parts)
    if path:
        return f"{SITE_URL}/{path}/"
    return f"{SITE_URL}/"


def abs_media_url(url: str) -> str:
    url = url.strip()
    url = re.sub(r"https?://kizilagacinsaat\.com", SITE_URL, url)
    if url.startswith("//"):
        url = "https:" + url
    if url.startswith("/"):
        return SITE_URL + url
    if url.startswith("wp-content/") or url.startswith("../wp-content/"):
        url = re.sub(r"^(\.\./)+", "", url)
        return f"{SITE_URL}/{url}"
    return url


def upsert_meta_property(text: str, prop: str, content: str) -> str:
    tag = f'<meta property="{prop}" content="{content}" />'
    pattern = rf'<meta property="{re.escape(prop)}" content="[^"]*"[^>]*/>\s*'
    if re.search(pattern, text, flags=re.I):
        return re.sub(pattern, tag + "\n", text, count=1, flags=re.I)
    insert_after = re.search(r"<title>[^<]*</title>\s*", text, flags=re.I)
    if insert_after:
        idx = insert_after.end()
        return text[:idx] + tag + "\n" + text[idx:]
    return text.replace("<head>", f"<head>\n{tag}", 1)


def upsert_meta_name(text: str, name: str, content: str) -> str:
    tag = f'<meta name="{name}" content="{content}" />'
    pattern = rf'<meta name="{re.escape(name)}" content="[^"]*"[^>]*/>\s*'
    if re.search(pattern, text, flags=re.I):
        return re.sub(pattern, tag + "\n", text, count=1, flags=re.I)
    insert_after = re.search(r'<meta name="description" content="[^"]*"[^>]*/>\s*', text, flags=re.I)
    if insert_after:
        idx = insert_after.end()
        return text[:idx] + tag + "\n" + text[idx:]
    insert_after = re.search(r"<title>[^<]*</title>\s*", text, flags=re.I)
    if insert_after:
        idx = insert_after.end()
        return text[:idx] + tag + "\n" + text[idx:]
    return text.replace("<head>", f"<head>\n{tag}", 1)


def extract_title(text: str) -> str:
    match = re.search(r"<title>([^<]+)</title>", text, flags=re.I)
    return match.group(1).strip() if match else "Kızılağaç İnşaat"


def pick_description(text: str, fpath: Path, is_en: bool) -> str:
    if fpath in {ROOT / "index.html", ROOT / "en/index.html"}:
        return DEFAULT_DESC_EN if is_en else DEFAULT_DESC_TR

    legacy = {LEGACY_DESC, LEGACY_DESC_EN}
    for pattern in (
        r'<meta property="og:description" content="([^"]*)"',
        r'<meta name="description" content="([^"]*)"',
        r'<meta name="twitter:description" content="([^"]*)"',
    ):
        match = re.search(pattern, text, flags=re.I)
        if match:
            desc = match.group(1).strip()
            if desc and desc not in legacy and len(desc) > 20:
                return desc
    title = extract_title(text)
    clean = re.sub(r"\s*-\s*Kızılağaç (İnşaat|Construction)\s*$", "", title, flags=re.I)
    if clean and clean != title:
        return clean
    return DEFAULT_DESC_EN if is_en else DEFAULT_DESC_TR


def pick_og_title(text: str, fpath: Path, is_en: bool) -> str:
    if fpath == ROOT / "index.html":
        return "Kızılağaç İnşaat"
    if fpath == ROOT / "en/index.html":
        return "Kızılağaç Construction"
    title = extract_title(text)
    return title.replace(" - Kızılağaç İnşaat", "").replace(" - Kızılağaç Construction", "").strip() or title


def pick_og_image(text: str) -> str:
    match = re.search(r'<meta property="og:image" content="([^"]+)"', text, flags=re.I)
    if match:
        url = abs_media_url(match.group(1))
        if "gravatar.com" not in url and "secure.gravatar" not in url:
            if "og-share.jpg" in url:
                return OG_IMAGE
            return url
    return OG_IMAGE


def patch_meta_tags(text: str, fpath: Path) -> str:
    if "<html" not in text.lower():
        return text

    en = is_en_page(fpath)
    og_title = pick_og_title(text, fpath, en)
    desc = pick_description(text, fpath, en)
    og_image = pick_og_image(text)
    public_url = page_public_url(fpath)

    text = re.sub(r'<meta name="twitter:label\d+"[^>]*>\s*', "", text, flags=re.I)
    text = re.sub(r'<meta name="twitter:data\d+"[^>]*>\s*', "", text, flags=re.I)

    text = upsert_meta_name(text, "description", desc)
    text = upsert_meta_property(text, "og:locale", "en_US" if en else "tr_TR")
    text = upsert_meta_property(text, "og:type", "website")
    text = upsert_meta_property(text, "og:title", og_title)
    text = upsert_meta_property(text, "og:description", desc)
    text = upsert_meta_property(text, "og:url", public_url)
    text = upsert_meta_property(text, "og:site_name", "Kızılağaç Construction" if en else "Kızılağaç İnşaat")
    text = upsert_meta_property(text, "og:image", og_image)
    text = upsert_meta_property(text, "og:image:secure_url", og_image)
    text = upsert_meta_property(text, "og:image:width", "1200")
    text = upsert_meta_property(text, "og:image:height", "630")
    text = upsert_meta_property(text, "og:image:alt", og_title)
    text = upsert_meta_property(text, "og:image:type", "image/jpeg")

    text = upsert_meta_name(text, "twitter:card", "summary_large_image")
    text = upsert_meta_name(text, "twitter:title", og_title)
    text = upsert_meta_name(text, "twitter:description", desc)
    text = upsert_meta_name(text, "twitter:image", og_image)

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

    text = re.sub(r'<style id="kiz-boot-css">.*?</style>\s*', '', text, flags=re.S)
    text = re.sub(r'<link[^>]*href=["\'][^"\']*static-fix\.css["\'][^>]*>\s*', "", text, flags=re.I)
    text = re.sub(r'<link[^>]*href=["\'][^"\']*modern-design\.css["\'][^>]*>\s*', "", text, flags=re.I)

    rel = depth_rel(fpath.parent)
    css_rel = rel.replace("static-fix.js", "static-fix.css")
    modern_css_rel = rel.replace("static-fix.js", "modern-design.css")
    prefix = wp_prefix(fpath.parent)

    css_tag = (
        f'<link rel="stylesheet" href="{css_rel}" />\n'
        f'<link rel="stylesheet" href="{modern_css_rel}" />\n'
    )
    js_tag = f'<script src="{rel}"></script>\n'

    viewport_match = re.search(
        r'(<meta name="viewport"[^>]*>\s*)',
        text,
        flags=re.I,
    )
    if viewport_match:
        insert_at = viewport_match.end()
        text = text[:insert_at] + BOOT_STYLE + text[insert_at:]
    elif "</head>" in text:
        text = text.replace("</head>", BOOT_STYLE + "</head>", 1)

    if f'href="{css_rel}"' not in text.split("</head>")[0] and "</head>" in text:
        text = text.replace("</head>", css_tag + "</head>", 1)

    text = re.sub(rf'{re.escape(css_tag)}(?=<script src="{re.escape(rel)}"></script>)', '', text)
    text = re.sub(r'(<script src="[^"]*static-fix\.js"></script>\s*)+', '', text)

    if f'src="{rel}"' not in text and "</body>" in text:
        text = text.replace("</body>", js_tag + "</body>", 1)
    elif f'src="{rel}"' not in text:
        text = text + js_tag

    text = re.sub(
        r'</body>\s*</html>\s*(?:<script[^>]*static-fix\.js[^>]*>\s*</script>\s*</body>\s*</html>\s*)+',
        '</body>\n</html>\n',
        text,
        flags=re.I,
    )

    if ('id="colophon"' in text or "id='colophon'" in text) and "post-46.css" not in text:
        post46 = (
            f"<link rel='stylesheet' id='elementor-post-46-css' "
            f"href='{prefix}wp-content/uploads/elementor/css/post-46.css' media='all' />"
        )
        if "</head>" in text:
            text = text.replace("</head>", f"{post46}\n</head>", 1)

    text = patch_meta_tags(text, fpath)

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
