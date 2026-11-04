# -*- coding: utf-8 -*-
"""Shared helpers: read the dictionaries and check a proposed string against the current one."""
import json
import re
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
LANGS = ("darija-latn", "darija-arab", "ar")
ENGLISH_ONLY = re.compile(r"^(hood|jury|lang)\.")

ARABIC = re.compile(r"[\u0600-\u06FF]")
PLACEHOLDER = re.compile(r"\{\w+\}")
ALLOWED_LATIN = [
    r"\{\w+\}",
    r"BonSafar|BONSAFAR",
    r"Muse (Spark|Image|Wonder|Voice Transcribe)|MUSE IMAGE",
    r"Kiwi\.com|trivago|Google|WhatsApp|Schengen",
    r"trik slama|TRIK SLAMA",
    r"\bQR\b|\bDH\b|\bEN\b",
]


def load_dicts():
    out = subprocess.run(
        ["node", "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", str(HERE / "dump-dicts.mjs")],
        cwd=ROOT,
        capture_output=True,
        check=True,
    )
    return json.loads(out.stdout.decode("utf-8"))


def keep_spacing(current, proposed):
    """Keeps the non-breaking space the current string puts before ! ? : (Excel cells lose it)."""
    for space in ("\u00a0", "\u202f"):
        if space in current:
            proposed = re.sub(r" (?=[!?:;])", space, proposed)
    return proposed


def problems(lang, current, proposed):
    """Why a proposed value is unsafe to ship, as a list of short French messages."""
    issues = []
    if sorted(PLACEHOLDER.findall(current)) != sorted(PLACEHOLDER.findall(proposed)):
        issues.append("variables {…} différentes du texte actuel")
    for marker in ("[[", "]]", "**"):
        if current.count(marker) != proposed.count(marker):
            issues.append(f"nombre de « {marker} » différent")
    if current.count("\n") != proposed.count("\n"):
        issues.append("nombre de retours à la ligne différent")
    if "—" in proposed:
        issues.append("tiret cadratin")
    if lang == "darija-latn" and ARABIC.search(proposed):
        issues.append("lettres arabes dans la darija latine")
    if lang in ("darija-arab", "ar"):
        stripped = proposed
        for pattern in ALLOWED_LATIN:
            stripped = re.sub(pattern, " ", stripped, flags=re.IGNORECASE)
        latin = re.search(r"[A-Za-zÀ-ÿ]{2,}", stripped)
        if latin:
            issues.append(f"mot en lettres latines : « {latin.group(0)} »")
    if not proposed.strip():
        issues.append("texte vide")
    return issues
