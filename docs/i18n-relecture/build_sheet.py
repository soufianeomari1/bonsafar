# -*- coding: utf-8 -*-
"""Builds the review spreadsheet and the provisional correction files.

Usage (from the repo root): python docs/i18n-relecture/build_sheet.py
Outputs, next to this file:
  - BonSafar-relecture-langues.xlsx
  - corrections-provisoires/{darija-latn,darija-arab,ar}.json  (every proposal, as if all were accepted)
"""
import json
import sys

from openpyxl import Workbook
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

from checks import ENGLISH_ONLY, HERE, LANGS, keep_spacing, load_dicts, problems
from lexicon import CONVENTIONS, LEXICON
from review_data import ROWS, SCREEN_ORDER

XLSX = HERE / "BonSafar-relecture-langues.xlsx"
PROVISIONAL = HERE / "corrections-provisoires"

HEADERS = [
    ("N°", 6),
    ("Écran", 20),
    ("Emplacement précis", 34),
    ("Type", 14),
    ("Clé i18n", 28),
    ("Sens en français (fr.ts)", 34),
    ("Darija lettres latines (actuel)", 34),
    ("Darija lettres arabes (actuel)", 34),
    ("Arabe classique (actuel)", 34),
    ("Gravité", 14),
    ("Mon avis", 52),
    ("Proposition darija latine", 34),
    ("Proposition darija arabe", 34),
    ("Proposition arabe classique", 34),
    ("Validation", 30),
]
RTL_COLUMNS = {8, 9, 13, 14}

INK = "0B0B0F"
HEADER_FILL = PatternFill("solid", fgColor=INK)
PROPOSAL_FILL = PatternFill("solid", fgColor="EAF2FF")
VALIDATION_FILL = PatternFill("solid", fgColor="FFF8DB")
GRAVITY_FILLS = {
    "A · Sens": PatternFill("solid", fgColor="FEECEC"),
    "B · Cohérence": PatternFill("solid", fgColor="FFF4E0"),
    "C · Orthographe": PatternFill("solid", fgColor="EFEFF4"),
    "OK": PatternFill("solid", fgColor="E8F7EE"),
}
THIN = Side(style="thin", color="E5E5EA")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
TOP_LEFT = Alignment(vertical="top", wrap_text=True)
TOP_RTL = Alignment(horizontal="right", vertical="top", wrap_text=True, readingOrder=2)
FONT = "Segoe UI"


def ordered_rows(dicts):
    for row in ROWS:
        for lang, field in zip(LANGS, ("latn", "arab", "ar")):
            if row[field] is not None and row["key"] in dicts[lang]:
                row[field] = keep_spacing(dicts[lang][row["key"]], row[field])
    keys = [k for k in dicts["keys"] if not ENGLISH_ONLY.match(k)]
    seen = {}
    for row in ROWS:
        if row["key"] in seen:
            sys.exit(f"duplicate key in review_data.py: {row['key']}")
        seen[row["key"]] = row
    missing = [k for k in keys if k not in seen]
    unknown = [k for k in seen if k not in dicts["keys"]]
    if missing or unknown:
        sys.exit(f"missing: {missing}\nunknown: {unknown}")
    rank = {screen: index for index, screen in enumerate(SCREEN_ORDER)}
    order = {row["key"]: index for index, row in enumerate(ROWS)}
    return sorted(ROWS, key=lambda row: (rank[row["screen"]], order[row["key"]]))


def check_proposals(rows, dicts):
    warnings = []
    for row in rows:
        for lang, field in zip(LANGS, ("latn", "arab", "ar")):
            proposal = row[field]
            if proposal is None:
                continue
            current = dicts[lang][row["key"]]
            if proposal == current:
                warnings.append(f"{row['key']} ({lang}): proposition identique au texte actuel")
            for issue in problems(lang, current, proposal):
                warnings.append(f"{row['key']} ({lang}): {issue}")
    return warnings


def style_header(ws, widths):
    for col, (title, width) in enumerate(widths, start=1):
        cell = ws.cell(row=1, column=col, value=title)
        cell.font = Font(name=FONT, bold=True, color="FFFFFF")
        cell.fill = HEADER_FILL
        cell.alignment = Alignment(vertical="center", wrap_text=True)
        cell.border = BORDER
        ws.column_dimensions[get_column_letter(col)].width = width
    ws.row_dimensions[1].height = 34


def write_guide(wb, counts):
    ws = wb.active
    ws.title = "Mode d'emploi"
    lines = [
        ("BonSafar · relecture darija et arabe classique", True),
        ("", False),
        ("1. Onglet « Lexique » : les mots uniques et les conventions d'écriture. Une remarque sur le lexique vaut pour toutes les lignes.", False),
        ("2. Onglet « Relecture » : une ligne par clé, dans l'ordre du parcours. Le filtre est sur la ligne de titre (colonne Écran, Gravité...).", False),
        ("3. Commence par filtrer Gravité = « A · Sens » : ce sont les phrases fausses ou ambiguës.", False),
        ("", False),
        ("Colonne Validation :", True),
        ("   OK  → j'accepte la proposition (ou le texte actuel s'il n'y a pas de proposition).", False),
        ("   NON → je garde le texte actuel, même s'il y a une proposition.", False),
        ("   Ta correction → corrige directement la cellule Proposition et écris OK,", False),
        ("        ou écris dans Validation : latn: … | arab: … | ar: …  (seulement les écritures que tu changes).", False),
        ("   Vide → ligne pas encore validée : rien ne change.", False),
        ("", False),
        ("Quand c'est fini : python docs/i18n-relecture/apply_validations.py", True),
        ("   → corrections/darija-latn.json, darija-arab.json, ar.json (seulement les clés modifiées) et un rapport.", False),
        ("   → puis colle le prompt de docs/i18n-relecture/prompt-cursor.md dans Cursor.", False),
        ("", False),
        ("Gravité :", True),
        ("   A · Sens : phrase fausse, ambiguë ou trompeuse.", False),
        ("   B · Cohérence : terme différent d'un écran à l'autre, latin et arabe qui ne disent pas la même chose, français ou arabe classique glissé dans la darija.", False),
        ("   C · Orthographe : conventions arabizi, ڤ et گ, ponctuation, articles.", False),
        ("", False),
        ("Chiffres :", True),
    ]
    lines += [(f"   {label} : {value}", False) for label, value in counts]
    lines += [
        ("", False),
        ("Hors tableau : les clés Under the hood, page jury et sélecteur de langue, affichées en anglais pour tous (ou dans leur propre langue).", False),
    ]
    for index, (text, bold) in enumerate(lines, start=1):
        cell = ws.cell(row=index, column=1, value=text)
        cell.font = Font(name=FONT, bold=bold, size=13 if index == 1 else 11)
    ws.column_dimensions["A"].width = 130


def write_lexicon(wb):
    ws = wb.create_sheet("Lexique")
    widths = [("Français", 26), ("Darija lettres latines", 30), ("Darija lettres arabes", 30),
              ("Arabe classique", 30), ("Remarque", 60), ("Validation", 30)]
    style_header(ws, widths)
    for r, entry in enumerate(LEXICON, start=2):
        for c, value in enumerate(entry, start=1):
            cell = ws.cell(row=r, column=c, value=value)
            cell.font = Font(name=FONT)
            cell.alignment = TOP_RTL if c in (3, 4) else TOP_LEFT
            cell.border = BORDER
        cell = ws.cell(row=r, column=6)
        cell.fill = VALIDATION_FILL
        cell.border = BORDER
    ws.freeze_panes = "B2"
    ws.auto_filter.ref = f"A1:F{len(LEXICON) + 1}"

    start = len(LEXICON) + 3
    title = ws.cell(row=start, column=1, value="Conventions d'écriture")
    title.font = Font(name=FONT, bold=True, size=12)
    for r, (scope, rule) in enumerate(CONVENTIONS, start=start + 1):
        ws.cell(row=r, column=1, value=scope).font = Font(name=FONT, bold=True)
        ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=5)
        cell = ws.cell(row=r, column=2, value=rule)
        cell.font = Font(name=FONT)
        cell.alignment = TOP_LEFT
        ws.row_dimensions[r].height = 32
        ws.cell(row=r, column=6).fill = VALIDATION_FILL


def write_review(wb, rows, dicts):
    ws = wb.create_sheet("Relecture")
    style_header(ws, HEADERS)
    for index, row in enumerate(rows, start=1):
        key = row["key"]
        values = [
            index,
            row["screen"],
            row["loc"],
            row["type"],
            key,
            dicts["fr"][key],
            dicts["darija-latn"][key],
            dicts["darija-arab"][key],
            dicts["ar"][key],
            row["grav"],
            row["avis"],
            row["latn"],
            row["arab"],
            row["ar"],
            None,
        ]
        r = index + 1
        for c, value in enumerate(values, start=1):
            cell = ws.cell(row=r, column=c, value=value)
            cell.font = Font(name=FONT, bold=(c == 5 and False))
            cell.alignment = TOP_RTL if c in RTL_COLUMNS else TOP_LEFT
            cell.border = BORDER
            if c in (12, 13, 14) and value:
                cell.fill = PROPOSAL_FILL
            if c == 10:
                cell.fill = GRAVITY_FILLS[value]
            if c == 15:
                cell.fill = VALIDATION_FILL
        ws.cell(row=r, column=5).font = Font(name="Consolas", size=10)

    last = len(rows) + 1
    ws.freeze_panes = "C2"
    ws.auto_filter.ref = f"A1:{get_column_letter(len(HEADERS))}{last}"

    choice = DataValidation(type="list", formula1='"OK,NON"', allow_blank=True,
                            showErrorMessage=False, showInputMessage=True,
                            promptTitle="Validation",
                            prompt="OK, NON, ou ta correction (latn: … | arab: … | ar: …)")
    ws.add_data_validation(choice)
    choice.add(f"O2:O{last}")

    done = PatternFill("solid", fgColor="E8F7EE")
    ws.conditional_formatting.add(f"O2:O{last}", FormulaRule(formula=['NOT(ISBLANK($O2))'], fill=done))


def write_provisional(rows):
    PROVISIONAL.mkdir(exist_ok=True)
    for lang, field in zip(LANGS, ("latn", "arab", "ar")):
        changes = {row["key"]: row[field] for row in rows if row[field] is not None}
        (PROVISIONAL / f"{lang}.json").write_text(
            json.dumps(changes, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )


def main():
    dicts = load_dicts()
    rows = ordered_rows(dicts)
    warnings = check_proposals(rows, dicts)

    by_gravity = {}
    for row in rows:
        by_gravity[row["grav"]] = by_gravity.get(row["grav"], 0) + 1
    proposals = {lang: sum(1 for row in rows if row[field]) for lang, field in zip(LANGS, ("latn", "arab", "ar"))}
    counts = [("Lignes", len(rows))]
    counts += [(g, by_gravity.get(g, 0)) for g in ("A · Sens", "B · Cohérence", "C · Orthographe", "OK")]
    counts += [(f"Propositions {lang}", n) for lang, n in proposals.items()]

    wb = Workbook()
    write_guide(wb, counts)
    write_lexicon(wb)
    write_review(wb, rows, dicts)
    wb.active = 2
    wb.save(XLSX)
    write_provisional(rows)

    print(f"{XLSX.name}: {len(rows)} rows")
    for label, value in counts[1:]:
        print(f"  {label}: {value}")
    if warnings:
        print("warnings:")
        for warning in warnings:
            print(f"  {warning}")


if __name__ == "__main__":
    main()
