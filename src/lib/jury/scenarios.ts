/**
 * The three judges' scenarios (docs/demo-et-mode-jury.md section 3). Plain
 * data, safe on both sides and importable by scripts with Node's type
 * stripping. Audio lives in public/jury/ as WAV PCM16 mono 24 kHz.
 */

export type JuryScenarioId = "istanbul" | "paris" | "sea";

export type JuryScenario = {
  id: JuryScenarioId;
  number: 1 | 2 | 3;
  /** Saved-run label: only a request with the jury cookie may use it. */
  label: `jury-${JuryScenarioId}`;
  title: string;
  status: { label: string; tone: "done" | "warn" | "running" };
  audio: string;
  /** Reference transcript of the voice note, as she says it. */
  darija: string;
  english: string;
  /** Older saved runs of the same trip, replayed until record:jury has run. */
  legacy: string | null;
};

export const JURY_SCENARIOS: JuryScenario[] = [
  {
    id: "istanbul",
    number: 1,
    label: "jury-istanbul",
    title: "Istanbul in December",
    status: { label: "No visa needed", tone: "done" },
    audio: "/jury/scenario-1-istanbul.wav",
    darija: "Bghit nsafer l'Istanbul m3a rajli f nouss décembre, chi semaine, budget 15 000 dh, bghina otel mzyan b ftour.",
    english:
      "I want to go to Istanbul with my husband in mid-December, about a week, budget 15,000 dh, a good hotel with breakfast.",
    legacy: "istanbul",
  },
  {
    id: "paris",
    number: 2,
    label: "jury-paris",
    title: "Paris for a weekend",
    status: { label: "Schengen visa needed", tone: "warn" },
    audio: "/jury/scenario-2-paris.wav",
    darija: "Bghit nmchi Paris weekend m3a bnti, f janvier.",
    english: "I want to go to Paris for a weekend with my daughter, in January.",
    legacy: "paris",
  },
  {
    id: "sea",
    number: 3,
    label: "jury-sea",
    title: "A sea trip, no details",
    status: { label: "Asks 1 question", tone: "running" },
    audio: "/jury/scenario-3-sea.wav",
    darija: "Bghit chi blasa fiha lb7er f l'été, ana w rajli.",
    english: "Somewhere by the sea this summer, me and my husband.",
    legacy: null,
  },
];

export const JURY_LABELS: readonly string[] = JURY_SCENARIOS.map((scenario) => scenario.label);

export function juryScenarioByLabel(label: string): JuryScenario | null {
  return JURY_SCENARIOS.find((scenario) => scenario.label === label) ?? null;
}
