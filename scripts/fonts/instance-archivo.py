"""
Writes src/fonts/archivo-latin-wdth100-125.woff2: Archivo (latin, variable) with the width axis cut to
100–125 %. The site only uses normal (100 %), 112 % (.font-ui) and 125 % (.font-display) widths, so
the condensed half of the axis (62–100 %) is dropped — the file goes from 90 KB to ~63 KB. Outlines
for every width and weight that is kept are unchanged (fontTools' instancer limits the axis exactly).

    pip install fonttools brotli
    python scripts/fonts/instance-archivo.py

Archivo is licensed under the SIL Open Font License 1.1 (src/fonts/archivo-OFL.txt).
"""
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2"
OUT = ROOT / "src/fonts/archivo-latin-wdth100-125.woff2"

font = instancer.instantiateVariableFont(TTFont(SRC), {"wdth": (100, 125)})
font.flavor = "woff2"
font.save(OUT)
print(f"{OUT.name}: {OUT.stat().st_size / 1024:.1f} KB (from {SRC.stat().st_size / 1024:.1f} KB)")
