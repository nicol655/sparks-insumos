"""Download and subset the three typefaces of §02 into versioned .woff2 files.

Run on demand, never during a build:

    docker compose -f docker/docker-compose.yml run --rm fonts

Why this exists: `next/font/google` downloads from fonts.googleapis.com on
*every* build, which made the quality gate fail intermittently (see
.ai/lessons.md). The files this writes are committed, so a build needs no
network at all. See ADR-0006.

Google serves one file per subset, and `next/font/local` cannot attach a
unicode-range to an individual source file. So instead of stitching Google's
per-subset files together, we take the complete TTF and cut one file per face
ourselves.

Only the latin subset ships. §02 asks for latin + latin-ext, but adding
latin-ext measured at 204KB against the 180KB budget of RNF-7, and neither
es-AR nor en uses a single codepoint from it: accented Spanish, inverted
punctuation, the em dash and the currency symbols all live in latin. Put
LATIN_EXT back into UNICODES below if content ever needs it.
"""

from __future__ import annotations

import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request
from dataclasses import dataclass
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent.parent / "src" / "styles" / "fonts"

# Asking as an ancient browser makes the CSS API hand back the complete TTF
# instead of the per-subset woff2 a modern browser would get.
LEGACY_UA = "Mozilla/4.0"

# Ranges verbatim from Google's own stylesheet.
LATIN = (
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,"
    "U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,"
    "U+2212,U+2215,U+FEFF,U+FFFD"
)
LATIN_EXT = (
    "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,"
    "U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,"
    "U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF"
)
UNICODES = LATIN


@dataclass(frozen=True)
class Family:
    """One typeface and the faces the design actually uses."""

    css_name: str
    file_prefix: str
    query: str


FAMILIES = (
    # §02: the scale only calls for 400, the wordmark for 500, and the
    # empty-cart message for italic 400. 300 and 600 are unused.
    Family("Cormorant Garamond", "cormorant", "Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500"),
    Family("Jost", "jost", "Jost:wght@200;300;400;500"),
    Family("IBM Plex Mono", "plex-mono", "IBM+Plex+Mono:wght@400;500"),
)

FACE_PATTERN = re.compile(
    r"font-style:\s*(?P<style>\w+);\s*"
    r"font-weight:\s*(?P<weight>\d+);\s*"
    r"(?:font-display:[^;]+;\s*)?"
    r"src:\s*url\((?P<url>[^)]+)\)",
    re.MULTILINE,
)


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": LEGACY_UA})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()


def faces(family: Family) -> list[tuple[str, int, str]]:
    css = fetch(f"https://fonts.googleapis.com/css2?family={family.query}&display=swap").decode()
    found = [(m["style"], int(m["weight"]), m["url"]) for m in FACE_PATTERN.finditer(css)]

    if not found:
        raise SystemExit(f"No @font-face found for {family.css_name}. The CSS API changed:\n{css}")

    return found


def subset(source: Path, target: Path) -> None:
    subprocess.run(
        [
            "pyftsubset",
            str(source),
            f"--unicodes={UNICODES}",
            "--layout-features=kern,liga,clig,calt,onum,lnum,frac",
            "--flavor=woff2",
            f"--output-file={target}",
        ],
        check=True,
    )


def main() -> int:
    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)
    OUT_DIR.mkdir(parents=True)

    total = 0

    with tempfile.TemporaryDirectory() as tmp:
        for family in FAMILIES:
            for style, weight, url in faces(family):
                suffix = "-italic" if style == "italic" else ""
                name = f"{family.file_prefix}-{weight}{suffix}.woff2"

                raw = Path(tmp) / f"{name}.ttf"
                raw.write_bytes(fetch(url))

                target = OUT_DIR / name
                subset(raw, target)

                size = target.stat().st_size
                total += size
                print(f"  {name:<28} {size // 1024:>4}KB")

    print(f"\n{len(list(OUT_DIR.glob('*.woff2')))} files, {total // 1024}KB total")
    print(f"Written to {OUT_DIR}")
    print("Commit them, then check the budget with: npm run font-budget")

    return 0


if __name__ == "__main__":
    sys.exit(main())
