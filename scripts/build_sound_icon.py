"""
Sound toggle icon: Amélie's animated SVG (~/Documents/Clients/Eleven/icons/sound-toggle-animations/
02-brush-sound-toggle.svg, 120 SMIL frames at 24 fps, 900 KB) → public/icons/sound-brush.json.

The source loop is: wave moving (0–55) → flattening (55–62) → flat line (62–96) → rising (97–119).
We keep 0–62 and 97–119 and only the on-curve points of each frame (the outline is dense enough
that a polygon of them is indistinguishable at 32 px). ~45 KB gzipped.

Run from src/:  python3 scripts/build_sound_icon.py <path to svg>
"""
import gzip
import json
import re
import sys

src = open(sys.argv[1]).read()
main = re.findall(r'values="([^"]*)"', src)[1].split(";")


def poly(d: str) -> str:
    nums = [float(x) for x in re.findall(r"-?\d+\.?\d*", d)]
    pts = [(nums[i], nums[i + 1]) for i in range(0, len(nums) - 1, 2)]
    ends = [pts[0]] + pts[3::3]  # "M p C c1 c2 p C …": every third point is on the curve
    out = []
    for p in ends:
        if not out or p != out[-1]:
            out.append(p)
    return "M" + " ".join("%g %g" % p for p in out) + "Z"


keep = list(range(0, 63)) + list(range(97, 120))
data = {"fps": 24, "frames": {i: poly(main[i]) for i in keep}}
js = json.dumps(data, separators=(",", ":"))
open("public/icons/sound-brush.json", "w").write(js)
print(f"{len(js) // 1024} KB raw, {len(gzip.compress(js.encode())) // 1024} KB gzipped")
