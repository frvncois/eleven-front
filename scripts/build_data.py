"""
Build the prototype's content + media from the site extraction.

Source:  ../docs/site-content.json + ../design/site-assets/*   (see project CLAUDE.md)
Output:  data/*.json              content the components read (never hardcode copy)
         public/media/<kind>/*.webp  resized WebP, 2x the largest rendered size

Run from src/:  python3 scripts/build_data.py
Re-run after the extraction changes. Existing WebP files are skipped unless --force.
"""

from __future__ import annotations
import json
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT.parent
ASSETS = PROJECT / "design" / "site-assets"
MEDIA = ROOT / "public" / "media"
DATA = ROOT / "data"
FORCE = "--force" in sys.argv

# Longest edge in px per kind: 2x the biggest slot the mockup gives it.
MAX_EDGE = {"work": 1600, "home": 2400, "longform": 2880, "studio": 2800, "team": 1200, "icons": 600}


CANONICAL_NAMES = {
    n.split(" ")[0].lower(): n
    for n in ["Jordan Meltzer", "Jeff Payne", "AJ Murillo", "Bob Gremore", "Bruce Bueckert",
              "Marco Tornillo", "Taylor Sargent", "Sean Kiely"]
}


def slugify(text: str) -> str:
    text = re.sub(r"[^a-z0-9]+", "-", text.lower())
    return re.sub(r"-+", "-", text).strip("-")


def to_webp(rel: str | None, kind: str) -> str | None:
    """design/site-assets/<rel> → public/media/<kind>/<name>.webp; returns the public URL."""
    if not rel:
        return None
    src = ASSETS / rel
    if not src.exists() or src.stat().st_size == 0:
        return None
    out = MEDIA / kind / (src.stem + ".webp")
    url = f"/media/{kind}/{out.name}"
    if out.exists() and not FORCE:
        return url
    out.parent.mkdir(parents=True, exist_ok=True)
    img = Image.open(src)
    has_alpha = img.mode in ("RGBA", "LA") or "transparency" in img.info
    img = img.convert("RGBA" if has_alpha else "RGB")
    img.thumbnail((MAX_EDGE[kind], MAX_EDGE[kind]), Image.LANCZOS)
    img.save(out, "WEBP", quality=80 if not has_alpha else 90, method=6)
    return url


def main() -> None:
    src = json.loads((PROJECT / "docs" / "site-content.json").read_text())

    # The live site spells names (and slugs) several ways; the Figma team cards are
    # the reference. Every name is resolved through its first name.
    def canonical(name: str | None) -> str | None:
        return CANONICAL_NAMES.get((name or "").split(" ")[0].lower()) if name else None

    icons = {slugify(canonical(m["name"])): m for m in src["mixers"]}
    team = []
    for i, p in enumerate(src["team"]):
        name = canonical(p["name"])
        slug = slugify(name)
        icon = icons.get(slug)
        team.append({
            "slug": slug,
            "name": name,
            "role": p["role"],
            "email": p.get("email") or None,
            "instagram": p.get("instagram") or None,
            "linkedin": p.get("linkedin") or None,
            "isMixer": icon is not None,
            "order": i,
            "photo": to_webp(p.get("file"), "team"),
            "icon": icon and {
                "name": icon["icon"],
                "white": to_webp(icon["icon_file"], "icons"),
                "black": to_webp(icon["icon_file"].replace(".png", "-black.png"), "icons"),
            },
        })

    def mixer_slug(name: str | None) -> str | None:
        return slugify(canonical(name)) if canonical(name) else None

    projects = []
    for w in src["mixer_work"]:
        projects.append({
            "slug": slugify(w["vimeo_title"] or w["slug"]),
            "kind": "spot",
            "title": w["vimeo_title"] or w["brand"],
            "client": w["client"] or w["brand"],
            "agency": w.get("agency") or None,
            "director": w.get("director") or None,
            "mixer": mixer_slug(w["mixer"]),
            "vimeo": w["vimeo"],
            "vimeoId": w["vimeo_id"],
            "previewStart": int(w["preview_start"]) if w.get("preview_start") else 0,
            "duration": w.get("duration_s"),
            "poster": to_webp(w["file"], "work"),
        })
    for l in src["longform"]:
        projects.append({
            "slug": slugify(l["title"] or l.get("vimeo_title") or l["slug"]),
            "kind": "longform",
            # Mixer-page longform rows carry no title on the live site: fall back to Vimeo's.
            "title": l["title"] or l.get("vimeo_title") or l["slug"],
            "client": l["client"] or l.get("brand") or None,
            "description": l.get("description") or None,
            "production": l.get("production") or None,
            "director": l.get("director") or None,
            "mixer": mixer_slug(l.get("mixer")),
            "vimeo": l["vimeo"],
            "vimeoId": l["vimeo_id"],
            "duration": l.get("duration_s"),
            "onLanding": bool(l.get("on_landing")),
            "poster": to_webp(l.get("file") or _longform_file(l, src["longform"]), "longform"),
        })

    home = [{
        "label": t["label"],
        "mixer": mixer_slug(t.get("mixer")),
        "agency": t.get("agency") or None,
        "director": t.get("director") or None,
        "vimeo": t["vimeo"],
        "vimeoId": t["preview_id"],
        "previewStart": int(t["preview_start"]) if t.get("preview_start") else 0,
        "poster": to_webp(t["file"], "home"),
    } for t in src["homepage_tiles"]]

    studio = [{"caption": s["caption"], "photo": to_webp(s["file"], "studio")} for s in src["studio_photos"]]

    DATA.mkdir(exist_ok=True)
    for name, value in {"team": team, "projects": projects, "home": home, "studio": studio}.items():
        (DATA / f"{name}.json").write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n")

    missing = [p["slug"] for p in projects if not p["poster"]]
    print(f"team {len(team)} · projects {len(projects)} · home {len(home)} · studio {len(studio)} · missing posters {missing}")


def _longform_file(entry: dict, all_longform: list) -> str | None:
    """Longform stills are numbered in site order: longform/NN-<slug>.jpg|png."""
    n = all_longform.index(entry) + 1
    matches = sorted((ASSETS / "longform").glob(f"{n:02d}-*"))
    return f"longform/{matches[0].name}" if matches else None


if __name__ == "__main__":
    main()
