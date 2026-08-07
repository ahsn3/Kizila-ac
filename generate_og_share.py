#!/usr/bin/env python3
"""Build og-share.jpg — logo only on brand background (no extra text)."""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).parent.resolve()
LOGO = ROOT / "wp-content/uploads/2025/06/Adsiz-200-x-47-piksel.png"
OUT = ROOT / "og-share.jpg"

CANVAS_W = 1200
CANVAS_H = 630
BG = (242, 240, 235)  # --kiz-surface
MAX_LOGO_W = 560


def main() -> None:
    logo = Image.open(LOGO).convert("RGBA")
    scale = MAX_LOGO_W / logo.width
    logo = logo.resize(
        (int(logo.width * scale), int(logo.height * scale)),
        Image.Resampling.LANCZOS,
    )

    canvas = Image.new("RGB", (CANVAS_W, CANVAS_H), BG)
    x = (CANVAS_W - logo.width) // 2
    y = (CANVAS_H - logo.height) // 2
    canvas.paste(logo, (x, y), logo)
    canvas.save(OUT, "JPEG", quality=92, optimize=True)
    print(f"Wrote {OUT} ({CANVAS_W}x{CANVAS_H})")


if __name__ == "__main__":
    main()
