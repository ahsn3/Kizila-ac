#!/usr/bin/env python3
"""Replace legacy service images with services-photos/ assets."""

import re
from pathlib import Path

ROOT = Path(__file__).parent.resolve()
SITE_URL = "https://kizilagac.netlify.app"

SERVICE_SLUG_TO_FILE = {
    "mimarlik-hizmetleri": "architecture-services.png",
    "architecture-services": "architecture-services.png",
    "ic-mimarlik-dekorasyon": "interior-architecture-decoration.png",
    "interior-architecture-decoration": "interior-architecture-decoration.png",
    "uygulama-tadilat": "application-renovation.png",
    "application-renovation": "application-renovation.png",
    "proje-yonetimi-danismanlik": "project-management-consulting.png",
    "project-management-consultancy": "project-management-consulting.png",
    "ucretsiz-kesif": "free-discovery.png",
    "free-exploration": "free-discovery.png",
    "cephe-dis-mekan-tasarimi": "facade-exterior-design.png",
    "facade-exterior-design": "facade-exterior-design.png",
}

LEGACY_TO_FILE = {
    "Adsiz-tasarim-3.png": "architecture-services.png",
    "Adsiz-tasarim-4.png": "interior-architecture-decoration.png",
    "Adsiz-tasarim-2.png": "project-management-consulting.png",
    "Adsiz-tasarim-5.png": "free-discovery.png",
    "Adsiz-tasarim-6.png": "facade-exterior-design.png",
    "Adsiz-tasarim.png": "application-renovation.png",
}


def rel_prefix(html_path: Path) -> str:
    depth = len(html_path.parent.relative_to(ROOT).parts)
    return "../" * depth if depth else ""


def service_photo_path(html_path: Path, filename: str) -> str:
    return f"{rel_prefix(html_path)}services-photos/{filename}"


def replace_legacy_images(text: str, html_path: Path, force_file: str | None = None) -> str:
    prefix = rel_prefix(html_path)

    for legacy_name, default_file in LEGACY_TO_FILE.items():
        filename = force_file or default_file
        new_src = f"{prefix}services-photos/{filename}"
        text = re.sub(
            rf"(?:\.\./)*wp-content/uploads/2026/01/{re.escape(legacy_name)}",
            new_src,
            text,
        )
        text = text.replace(
            f"https://kizilagacinsaat.com/wp-content/uploads/2026/01/{legacy_name}",
            new_src,
        )
        text = text.replace(
            f"https://kizilagac.netlify.app/wp-content/uploads/2026/01/{legacy_name}",
            new_src,
        )
        text = text.replace(
            f"http://kizilagacinsaat.com/wp-content/uploads/2026/01/{legacy_name}",
            new_src,
        )

    text = re.sub(r'\s*srcset="[^"]*Adsiz-tasarim[^"]*"', "", text, flags=re.I)
    text = re.sub(
        rf"https://kizilagac\.netlify\.app/(?:\.\./)+services-photos/",
        f"{SITE_URL}/services-photos/",
        text,
    )
    text = re.sub(
        rf"https://kizilagacinsaat\.com/(?:\.\./)+services-photos/",
        f"{SITE_URL}/services-photos/",
        text,
    )
    text = re.sub(
        rf"http://kizilagacinsaat\.com/(?:\.\./)*services-photos/",
        f"{SITE_URL}/services-photos/",
        text,
    )
    return text


def patch_file(html_path: Path, force_file: str | None = None) -> bool:
    orig = html_path.read_text(encoding="utf-8", errors="replace")
    text = replace_legacy_images(orig, html_path, force_file)
    if text != orig:
        html_path.write_text(text, encoding="utf-8")
        return True
    return False


def main():
    n = 0

    for slug, filename in SERVICE_SLUG_TO_FILE.items():
        for base in (ROOT / "service" / slug, ROOT / "en" / "service" / slug):
            index = base / "index.html"
            if index.exists() and patch_file(index, filename):
                n += 1
                print(f"Patched {index.relative_to(ROOT)}")

    for listing in (ROOT / "index.html", ROOT / "en" / "index.html"):
        if listing.exists() and patch_file(listing):
            n += 1
            print(f"Patched {listing.relative_to(ROOT)}")

    print(f"Done — {n} files updated")


if __name__ == "__main__":
    main()
