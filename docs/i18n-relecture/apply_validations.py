# -*- coding: utf-8 -*-
"""Turns the "Validation" column of the review spreadsheet into correction files.

Usage (from the repo root): python docs/i18n-relecture/apply_validations.py [path/to/file.xlsx]
Writes, next to this file:
  - corrections/{darija-latn,darija-arab,ar}.json : only the keys that change, with their new value
  - corrections/rapport.md : what was applied, skipped or needs a look

Validation cell:
  OK    accept the proposal cells of the row (no proposal: nothing changes)
  NON   keep the current text
  text  "latn: … | arab: … | ar: …" (only the scripts you change). Without a prefix, the text
        goes to the only script that has a proposal on that row.
  empty not validated yet: nothing changes
"""
import json
import re
import sys
from pathlib import Path

from openpyxl import load_workbook

from checks import HERE, LANGS, keep_spacing, load_dicts, problems

SOURCE = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / "BonSafar-relecture-langues.xlsx"
OUT = HERE / "corrections"
PREFIX = {"latn": "darija-latn", "arab": "darija-arab", "ar": "ar"}
PROPOSAL_COLUMNS = {
    "darija-latn": "Proposition darija latine",
    "darija-arab": "Proposition darija arabe",
    "ar": "Proposition arabe classique",
}
SPLIT = re.compile(r"(?:^|\|)\s*(latn|arab|ar)\s*:\s*", re.IGNORECASE)


def text(value):
    return "" if value is None else str(value).replace("\r\n", "\n")


def parse_correction(raw, proposed_langs):
    """Returns {lang: value} or None if the cell cannot be read without guessing."""
    parts = SPLIT.split(raw)
    if len(parts) == 1:
        return {proposed_langs[0]: raw.strip()} if len(proposed_langs) == 1 else None
    if parts[0].strip():
        return None
    out = {}
    for prefix, value in zip(parts[1::2], parts[2::2]):
        out[PREFIX[prefix.lower()]] = value.strip()
    return out


def main():
    dicts = load_dicts()
    ws = load_workbook(SOURCE, data_only=True)["Relecture"]
    header = [cell.value for cell in ws[1]]
    col = {name: index for index, name in enumerate(header)}

    changes = {lang: {} for lang in LANGS}
    applied, kept, pending, unreadable, flagged = [], [], [], [], []

    for row in ws.iter_rows(min_row=2, values_only=True):
        key = text(row[col["Clé i18n"]]).strip()
        if not key:
            continue
        number = row[col["N°"]]
        decision = text(row[col["Validation"]]).strip()
        proposals = {lang: text(row[col[name]]) for lang, name in PROPOSAL_COLUMNS.items() if text(row[col[name]]).strip()}

        if not decision:
            pending.append(key)
            continue
        if decision.upper() == "NON":
            kept.append(key)
            continue
        if decision.upper() == "OK":
            chosen = proposals
        else:
            chosen = parse_correction(decision, list(proposals))
            if chosen is None:
                unreadable.append(f"- n° {number} `{key}` : « {decision} » (ajoute latn:, arab: ou ar: devant chaque texte)")
                continue

        for lang, value in chosen.items():
            current = dicts[lang][key]
            value = keep_spacing(current, value)
            if value == current:
                continue
            issues = problems(lang, current, value)
            if issues:
                flagged.append(f"- n° {number} `{key}` ({lang}) : {', '.join(issues)} → « {value} »")
                continue
            changes[lang][key] = value
        if chosen:
            applied.append(key)
        else:
            kept.append(key)

    OUT.mkdir(exist_ok=True)
    for lang in LANGS:
        (OUT / f"{lang}.json").write_text(json.dumps(changes[lang], ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    total = sum(len(c) for c in changes.values())
    report = [
        "# Corrections de langue",
        "",
        f"Source : `{SOURCE.name}`.",
        "",
        f"- Clés modifiées : darija-latn {len(changes['darija-latn'])}, darija-arab {len(changes['darija-arab'])}, ar {len(changes['ar'])} (total {total}).",
        f"- Lignes validées avec changement : {len(applied)}. Gardées telles quelles : {len(kept)}. Pas encore validées : {len(pending)}.",
        "",
        "## Corrections écartées (absentes des JSON)",
        "",
        "Corrige la cellule dans le tableur, puis relance le script.",
        "",
        *(flagged or ["Aucune : les variables, les marqueurs et les écritures sont cohérents."]),
        "",
        "## Validations illisibles (absentes des JSON)",
        "",
        *(unreadable or ["Aucune."]),
        "",
        "## Lignes pas encore validées",
        "",
        (", ".join(f"`{k}`" for k in pending) if len(pending) <= 60
         else f"{len(pending)} lignes : filtre la colonne Validation sur « (Vides) » dans le tableur.") if pending else "Aucune.",
        "",
    ]
    (OUT / "rapport.md").write_text("\n".join(report), encoding="utf-8")

    print(f"changes: latn {len(changes['darija-latn'])}, arab {len(changes['darija-arab'])}, ar {len(changes['ar'])}")
    print(f"pending: {len(pending)}, unreadable: {len(unreadable)}, rejected: {len(flagged)}")
    print(f"report: {OUT / 'rapport.md'}")


if __name__ == "__main__":
    main()
