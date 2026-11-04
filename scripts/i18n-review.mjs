// Checks the five dictionaries and writes docs/i18n-review.md, one row per key.
// - coverage: a key missing from a dictionary falls back to English on screen
// - mixed strings: a value that carries words of another language
// - "to review": the key sits under a TODO comment in a darija or Arabic dictionary
// Usage: npm run i18n:review [-- --check]   (--check: exit 1 on missing keys or mixed strings)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ar } from "../src/lib/i18n/ar.ts";
import { darijaArab } from "../src/lib/i18n/darija-arab.ts";
import { darijaLatn } from "../src/lib/i18n/darija-latn.ts";
import { en } from "../src/lib/i18n/en.ts";
import { fr } from "../src/lib/i18n/fr.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const LANGS = [
  { id: "fr", dict: fr },
  { id: "en", dict: en },
  { id: "ar", dict: ar },
  { id: "darija-latn", dict: darijaLatn },
  { id: "darija-arab", dict: darijaArab },
];
const REVIEWED = ["ar", "darija-latn", "darija-arab"];

/** Shown in English to everyone: no translation expected. */
const ENGLISH_ONLY = /^(hood|jury)\./;
/** Same text in every language on purpose. */
const SAME_EVERYWHERE = new Set(["welcome.tagline", "file.stamp", "welcome.demo.duration", "home.muse"]);
/** The language picker names each language in its own language; the demo transcript is speech. */
const EXEMPT = (key) => key.startsWith("lang.") || key === "welcome.demo.transcript";

/** Names and symbols allowed in any script. */
const ALLOWED = [
  /\{\w+\}/g,
  /\*\*|\[\[|\]\]/g,
  /BonSafar|BONSAFAR/g,
  /Muse (Spark|Image|Wonder|Voice Transcribe)|MUSE IMAGE/g,
  /Kiwi\.com|trivago|Google|WhatsApp|Schengen/g,
  /trik slama|TRIK SLAMA/gi,
  /\bQR\b|\bDH\b|\bEN\b|€/g,
];

const ARABIC = /[\u0600-\u06FF]/;
const LATIN_WORD = /[A-Za-zÀ-ÿ]{2,}/;
const FRENCH_ACCENT = /[éèêàçùôîûœ]/i;
const ARABIZI = /\b[a-z]*[379][a-z]+\b|\b[a-z]+[379]\b/i;
const DARIJA_LATN_WORDS =
  /\b(salam|yallah|mfhoum|kemmel|kmel|dyal\w*|bghit\w*|brek|hder|wajed|tqriban|qelleb|kanq\w+|kanf\w+|hadchi|fhemt|chwiya|nkemmel|mwafeq|bslama|ktebha|liya|bla|walo|daba|wla|m3a|chouf|tsafer|fin)\b/i;
const FRENCH_WORDS = /\b(je|tu|le|la|les|des|du|et|ton|ta|tes|avec|pour|vérifie|continuer|valide|compris|voyage|forfait)\b/i;
const ENGLISH_WORDS =
  /(?<![A-Za-zÀ-ÿ])(the|and|with|your|you|search|confirm|got it|next|flights?|press|speak|made|boarding|pass|generated|goodbye|journey|searching|checking|building|comparing)(?![A-Za-zÀ-ÿ])/i;
const DARIJA_ARAB_WORDS =
  /(?<![\u0600-\u06FF])(ديال|ديالك|بزاف|دابا|غادي|هادشي|بغيت|بغيتي|برك|وهضر|هضر|ديريكت|الفورفي|فورفي|كنقلب|كنقارن|كنشوف|كنتحقق|كنوجد|واجد|كمّل|كمل|شوف|والو|فين|كيفاش|علاش|مزيان|راه|يالله|مفهوم|قلب)(?![\u0600-\u06FF])/;

function strip(value) {
  let text = value;
  for (const pattern of ALLOWED) text = text.replace(pattern, " ");
  return text;
}

/** Why this value looks like it mixes languages, or null. */
function mixed(lang, key, value) {
  if (EXEMPT(key) || SAME_EVERYWHERE.has(key) || ENGLISH_ONLY.test(key)) return null;
  const text = strip(value);
  switch (lang) {
    case "fr":
      if (ARABIC.test(text)) return "lettres arabes";
      if (DARIJA_LATN_WORDS.test(text) && !/\b(la|le)\b/.test(text.match(DARIJA_LATN_WORDS)[0])) {
        return `darija : « ${text.match(DARIJA_LATN_WORDS)[0]} »`;
      }
      if (ARABIZI.test(text)) return `arabizi : « ${text.match(ARABIZI)[0]} »`;
      if (ENGLISH_WORDS.test(text)) return `anglais : « ${text.match(ENGLISH_WORDS)[0]} »`;
      return null;
    case "en":
      if (ARABIC.test(text)) return "lettres arabes";
      if (FRENCH_ACCENT.test(text)) return "accent français";
      if (DARIJA_LATN_WORDS.test(text)) return `darija : « ${text.match(DARIJA_LATN_WORDS)[0]} »`;
      if (ARABIZI.test(text)) return `arabizi : « ${text.match(ARABIZI)[0]} »`;
      return null;
    case "darija-latn":
      if (ARABIC.test(text)) return "lettres arabes";
      if (FRENCH_ACCENT.test(text)) return `français accentué : « ${text.match(/\S*[éèêàçùôîûœ]\S*/i)[0]} »`;
      if (/ · /.test(value) && (FRENCH_WORDS.test(text) || ENGLISH_WORDS.test(text))) return "doublon darija · autre langue";
      if (ENGLISH_WORDS.test(text)) return `anglais : « ${text.match(ENGLISH_WORDS)[0]} »`;
      return null;
    case "darija-arab":
    case "ar": {
      const latin = text.match(LATIN_WORD);
      if (latin) return `lettres latines : « ${latin[0]} »`;
      if (/[0-9]/.test(text) === false && /[٠-٩]/.test(text)) return "chiffres arabes orientaux";
      if (lang === "ar" && DARIJA_ARAB_WORDS.test(text)) return `darija : « ${text.match(DARIJA_ARAB_WORDS)[0]} »`;
      if (/[٠-٩]/.test(text)) return "chiffres arabes orientaux";
      return null;
    }
    default:
      return null;
  }
}

/** Keys that sit under a TODO comment block in a dictionary file. */
function todoKeys(lang) {
  const lines = readFileSync(join(root, "src", "lib", "i18n", `${lang}.ts`), "utf8").split(/\r?\n/);
  const keys = new Set();
  let comments = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("//")) {
      comments.push(trimmed);
      continue;
    }
    const key = trimmed.match(/^"([^"]+)":/)?.[1];
    if (key && comments.some((c) => c.includes("TODO"))) keys.add(key);
    if (trimmed) comments = [];
  }
  return keys;
}

const SCREENS = [
  [/^common\./, "Partagé"],
  [/^welcome\./, "00 Bienvenue"],
  [/^(onboarding|passport|companions|airport|style|prefs)\./, "01 Profil (4 étapes)"],
  [/^trust\./, "01 ter Confiance"],
  [/^profile\./, "Profil"],
  [/^(home|idea)\./, "02 Accueil"],
  [/^voice\./, "03 Vocal"],
  [/^(understood|chip|edit)\./, "04 Compris"],
  [/^search\./, "Recherche (attente)"],
  [/^plan\./, "05 Plan de vol"],
  [/^result\./, "06 Résultat"],
  [/^(package|notice|reject|visaKind|price)\./, "07 Forfait"],
  [/^ready\./, "08 Prêt à partir"],
  [/^check\./, "09 Vérifie et continue"],
  [/^file\./, "10 Dossier"],
  [/^poster\./, "10 bis Affiche"],
  [/^hood\./, "Under the hood (jury, EN)"],
  [/^jury\./, "Page jury (EN)"],
  [/^lang\./, "Sélecteur de langue"],
  [/^safar\./, "Mascotte (lecteur d'écran)"],
];

const TYPES = [
  [/(error|Error|missing|Missing|Denied|Unsupported|tooShort|nothingHeard|fallback$|linkMissing|plan\.error)/, "erreur"],
  [/(^safar\.|Label$|\.micLabel|\.open$|\.play$|\.pauseAudio$|\.delete$|\.send$|childrenLess|childrenMore|\.less$|\.more$)/, "libellé (aria)"],
  [/(\.go$|\.validate$|\.continue$|\.cta$|signIn|signOut|\.google$|\.guest$|share$|retry$|\.next$|\.skip$|\.back$|\.close$|\.cancel$|\.save$|\.finish$|\.remove$|openFlight|openHotel|\.booked$|\.poster$|seePackage|replayLast|restart|keepWithGoogle|saveGoogle|backHome|backToPlan|\.how$|\.edit$|\.detail$|\.hide$|otherAnswer|common\.understood)/, "CTA"],
  [/(^home\.chip\.|^idea\.|^chip\.|^welcome\.demo\.(city|country|dates|when|adults|breakfast|visa)$|^passport\.|^companions\.|^airport\.|^style\.[a-z]+$|^lang\.)/, "chip"],
  [/(understood\.safar|home\.bubble|voice\.(pill|title|subtitle)|plan\.title|plan\.landed|onboarding\.language\.ask|onboarding\.hello|understood\.noQuestion|ready\.knowLoading|poster\.loading|search\.title|understood\.(transcribing|thinking)|plan\.step\.[a-z_]+$)/, "message de Safar"],
  [/(plan\.status|Count$|recommended|\.direct$|cheapest|visaFree|visaNeeded|passportDays|passportCheck|bagCabin|bagChecked|moneyShare|kicker|voice\.paused|headerStatus|saved|copied|plan\.replay$|plan\.captured|price\.captured|questionBadge|nightsLabel|loading|visaKind|reject\.|notice\.|signedIn|signedOut)/, "statut"],
  [/(title|Title|heading|^file\.(date|depart|passengers|hotel|nights)$|package\.(before|why|tip|trends|rejected)$|ready\.know$)/, "titre"],
  [/(hint|Hint|note|Note|subtitle|\.sub$|subFree|tapHint|editHint|placeholder|Placeholder|\.lead$|pricesNote|\.qr$|shield|payBody|\.soon$|\.step\.[a-z_]+\.hint$|example|micHint|holdRest|holdLead|sources)/, "aide"],
];

function pick(table, key, fallback) {
  return table.find(([pattern]) => pattern.test(key))?.[1] ?? fallback;
}

function location(key) {
  const rest = key.split(".").slice(1).join(" · ");
  return rest.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
}

const cell = (value) =>
  value === undefined ? "∅" : String(value).replace(/\|/g, "\\|").replace(/\n/g, "<br>").trim() || "∅";

const keys = Object.keys(en);
const todos = Object.fromEntries(REVIEWED.map((lang) => [lang, todoKeys(lang)]));
const missing = [];
const flagged = [];

for (const key of keys) {
  for (const { id, dict } of LANGS) {
    const value = dict[key];
    if (value === undefined) {
      if (!ENGLISH_ONLY.test(key) && !key.startsWith("lang.")) missing.push(`${id}: ${key}`);
      continue;
    }
    const reason = mixed(id, key, value);
    if (reason) flagged.push({ lang: id, key, value, reason });
  }
}

const rows = keys.map((key) => {
  const toReview = REVIEWED.filter((lang) => todos[lang].has(key));
  return [
    `\`${key}\``,
    pick(SCREENS, key, "Autre"),
    location(key),
    pick(TYPES, key, "libellé"),
    ...LANGS.map(({ dict }) => cell(dict[key] ?? (ENGLISH_ONLY.test(key) || key.startsWith("lang.") ? "(EN)" : undefined))),
    toReview.length ? `☑ ${toReview.join(", ")}` : "☐",
  ];
});

const header = ["clé", "écran", "emplacement", "type", "fr", "en", "ar", "darija-latn", "darija-arab", "à relire"];
const table = [
  `| ${header.join(" | ")} |`,
  `| ${header.map(() => "---").join(" | ")} |`,
  ...rows.map((row) => `| ${row.join(" | ")} |`),
].join("\n");

const flaggedList = flagged.length
  ? flagged.map((f) => `- \`${f.key}\` (${f.lang}) : ${f.reason} → « ${cell(f.value)} »`).join("\n")
  : "Aucune chaîne mixte détectée.";

const reviewCount = rows.filter((row) => row.at(-1) !== "☐").length;
const doc = `# Relecture des langues

Généré par \`npm run i18n:review\` à partir de \`src/lib/i18n/*.ts\`. Ne pas éditer à la main : corrige les dictionnaires, puis relance le script.

- ${keys.length} clés, 5 langues. ${reviewCount} clés ont au moins une chaîne marquée TODO à relire (darija ou arabe).
- « (EN) » : clé affichée en anglais pour tout le monde (Under the hood, page jury) ou nom de langue dans sa propre langue (sélecteur).
- Exceptions voulues : le nom BonSafar, la signature « trik slama », les marques (Kiwi.com, trivago, Google, Muse Spark, Muse Image), le symbole DH, et la transcription de démonstration (parole de l'utilisatrice).
- En mode jury (\`?jury=1\`), l'écran reste en anglais avec la darija en dessous : ce n'est pas un mélange.

## Clés manquantes

${missing.length ? missing.map((m) => `- ${m}`).join("\n") : "Aucune : chaque clé existe dans les 5 dictionnaires."}

## Chaînes mixtes détectées automatiquement

${flaggedList}

## Toutes les clés

${table}
`;

writeFileSync(join(root, "docs", "i18n-review.md"), doc);
console.log(`docs/i18n-review.md: ${keys.length} keys, ${reviewCount} to review`);
console.log(`missing: ${missing.length}`);
for (const m of missing) console.log(`  ${m}`);
console.log(`mixed: ${flagged.length}`);
for (const f of flagged) console.log(`  ${f.lang.padEnd(11)} ${f.key}: ${f.reason}`);
if (process.argv.includes("--check") && (missing.length || flagged.length)) process.exit(1);
