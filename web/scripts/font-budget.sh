#!/bin/sh
# Reports the weight of the versioned font files (RNF-7: target < 180KB).
#
# The files in src/styles/fonts are what a reader downloads: one .woff2 per
# face, subset to latin, produced by scripts/fetch_fonts.py. Nothing is fetched
# at build time, so this measurement is deterministic and needs no build —
# unlike the previous version, which had to classify Google's per-subset output
# by parsing unicode-range out of the compiled CSS.
set -e

FONTS="src/styles/fonts"
BUDGET_KB=180

if [ ! -d "$FONTS" ]; then
  echo "No fonts in $FONTS. Run: docker compose -f docker/docker-compose.yml run --rm fonts" >&2
  exit 1
fi

total=0
count=0

printf "%-30s %8s\n" "file" "size"
echo "---------------------------------------"

for file in "$FONTS"/*.woff2; do
  size=$(wc -c < "$file")
  total=$((total + size))
  count=$((count + 1))
  printf "%-30s %6sKB\n" "$(basename "$file")" "$((size / 1024))"
done

echo "---------------------------------------"
printf "%-30s %6sKB\n" "$count faces, latin subset" "$((total / 1024))"
printf "%-30s %6sKB\n" "budget (RNF-7)" "$BUDGET_KB"

if [ "$count" -eq 0 ]; then
  echo "No .woff2 found — the fonts were never fetched." >&2
  exit 1
fi

if [ "$((total / 1024))" -gt "$BUDGET_KB" ]; then
  echo "OVER BUDGET"
  exit 1
fi

echo "within budget"
