// Prints the five dictionaries as JSON, read straight from src/lib/i18n/*.ts.
// Usage: node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON docs/i18n-relecture/dump-dicts.mjs
import { ar } from "../../src/lib/i18n/ar.ts";
import { darijaArab } from "../../src/lib/i18n/darija-arab.ts";
import { darijaLatn } from "../../src/lib/i18n/darija-latn.ts";
import { en } from "../../src/lib/i18n/en.ts";
import { fr } from "../../src/lib/i18n/fr.ts";

process.stdout.write(
  JSON.stringify({ keys: Object.keys(en), fr, en, "darija-latn": darijaLatn, "darija-arab": darijaArab, ar })
);
