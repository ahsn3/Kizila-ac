#!/usr/bin/env bash
# Regenerate compressed WebP hero backgrounds from PNG sources.
set -euo pipefail
cd "$(dirname "$0")/hero-background"
if [[ -f "Mimarlık Hizmetleri.png" ]]; then
  cp "Mimarlık Hizmetleri.png" hero-architecture.png
fi
for name in hero-living hero-kitchen hero-architecture; do
  if [[ -f "${name}.png" ]]; then
    cwebp -q 82 -m 6 -mt "${name}.png" -o "${name}.webp"
    echo "Wrote ${name}.webp"
  fi
done
