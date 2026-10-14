"""
Index layout (Figma V1 · 08 · Index, grid 7345:1515 / list 7345:1560) → data/index.json.
scripts/index_layout.txt holds the 66 grid tiles exported from Figma: n;x;y;w;h;Title | Client.
Positions are shifted into a padded field; every tile is matched to a project in data/projects.json.
Run from src/:  python3 scripts/build_index.py
"""
import json
import re

projects = json.load(open("data/projects.json"))
norm = lambda s: re.sub(r"[^a-z0-9]", "", (s or "").lower())
# Two titles the fuzzy match cannot tell apart.
OVERRIDES = {"Aaliyah": "vice-a-to-z-aaliyah", "AZ Aaliyah": "09-vice-az-aaliyah"}

rows, missing, used = [], [], set()
for line in open("scripts/index_layout.txt"):
    n, x, y, w, h, label = line.strip().split(";", 5)
    title, client = [t.strip() for t in label.split("|")]
    free = [p for p in projects if p["slug"] not in used]
    if title in OVERRIDES:
        cands = [p for p in free if p["slug"] == OVERRIDES[title]]
    else:
        cands = [p for p in free if norm(title) == norm(p["short"])] or [p for p in free if norm(title) in norm(p["title"])]
        if len(cands) > 1:
            by_client = [p for p in cands if norm(client) in norm(p["client"]) or norm(client) in norm(p["title"])]
            cands = by_client or cands
    if not cands:
        missing.append(label)
        continue
    used.add(cands[0]["slug"])
    rows.append({"slug": cands[0]["slug"], "title": title, "client": client, "x": int(x), "y": int(y), "w": int(w), "h": int(h)})

pad = 160
minx, miny = min(r["x"] for r in rows), min(r["y"] for r in rows)
for r in rows:
    r["x"] += pad - minx
    r["y"] += pad - miny
field = {"w": max(r["x"] + r["w"] for r in rows) + pad, "h": max(r["y"] + r["h"] for r in rows) + pad}
json.dump({"field": field, "tiles": rows}, open("data/index.json", "w"), indent=1, ensure_ascii=False)
print(f"{len(rows)} tiles, field {field}, missing {missing}")
