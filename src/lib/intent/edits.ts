import type { Intent, IntentLocks, QuestionField } from "./schema";

/** A chip the traveller changed by hand. Wishes are kept too, though no question asks about them. */
export type UserEdit = QuestionField | "wishes";

/** True when that fact is concrete enough to search or to retire the question about it. */
export function fieldIsFilled(intent: Intent, field: QuestionField): boolean {
  switch (field) {
    case "destination":
      return intent.destination !== null;
    case "dates":
      return intent.depart_date !== null && intent.return_date !== null;
    case "nights":
      return intent.nights !== null;
    case "travelers":
      return intent.adults >= 1;
    case "budget":
      return intent.budget_mad !== null || intent.budget_per_night_mad !== null;
  }
}

/** Destination and real dates. Anything else can wait, whoever filled these in. */
export function hasIndispensableInfo(intent: Intent): boolean {
  return fieldIsFilled(intent, "destination") && fieldIsFilled(intent, "dates");
}

export function fieldsTouched(patch: Partial<Intent>): UserEdit[] {
  const fields: UserEdit[] = [];
  if ("destination" in patch) fields.push("destination");
  if ("depart_date" in patch || "return_date" in patch) fields.push("dates", "nights");
  if ("nights" in patch && !fields.includes("nights")) fields.push("nights");
  if ("adults" in patch || "children" in patch) fields.push("travelers");
  if ("budget_mad" in patch || "budget_per_night_mad" in patch) fields.push("budget");
  if ("wishes" in patch) fields.push("wishes");
  return fields;
}

/** The locked payload sent to /api/intent. Empty when the traveller has not edited anything. */
export function locksFor(intent: Intent, edited: readonly UserEdit[]): IntentLocks | undefined {
  const fields = edited.filter((field): field is QuestionField => field !== "wishes");
  if (!fields.length) return undefined;
  const locks: IntentLocks = { fields };
  if (fields.includes("destination")) locks.destination = intent.destination;
  if (fields.includes("dates")) {
    locks.depart_date = intent.depart_date;
    locks.return_date = intent.return_date;
    locks.nights = intent.nights;
  }
  if (fields.includes("nights")) locks.nights = intent.nights;
  if (fields.includes("travelers")) {
    locks.adults = intent.adults;
    locks.children = intent.children;
  }
  if (fields.includes("budget")) {
    locks.budget_mad = intent.budget_mad;
    locks.budget_per_night_mad = intent.budget_per_night_mad;
  }
  return locks;
}

/** Copy locked facts onto a model result, and drop a question whose fact is now locked and filled. */
export function applyLocks(intent: Intent, locks: IntentLocks): Intent {
  const next: Intent = { ...intent };
  const fields = new Set(locks.fields);
  if (fields.has("destination") && locks.destination !== undefined) next.destination = locks.destination;
  if (fields.has("dates")) {
    if (locks.depart_date !== undefined) next.depart_date = locks.depart_date;
    if (locks.return_date !== undefined) next.return_date = locks.return_date;
  }
  if ((fields.has("nights") || fields.has("dates")) && locks.nights !== undefined) next.nights = locks.nights;
  if (fields.has("travelers")) {
    if (locks.adults !== undefined) next.adults = locks.adults;
    if (locks.children !== undefined) next.children = locks.children;
  }
  if (fields.has("budget") && locks.budget_mad !== undefined) next.budget_mad = locks.budget_mad;
  if (fields.has("budget") && locks.budget_per_night_mad !== undefined) {
    next.budget_per_night_mad = locks.budget_per_night_mad;
  }
  if (next.question && fields.has(next.question.field) && fieldIsFilled(next, next.question.field)) {
    next.question = null;
  }
  return next;
}

/**
 * Keep every hand-edited fact from the previous intent. The model may rewrite
 * only the facts the traveller has not touched.
 */
export function mergeIntent(incoming: Intent, previous: Intent, edited: readonly UserEdit[]): Intent {
  const locks = locksFor(previous, edited);
  const next = locks ? applyLocks(incoming, locks) : { ...incoming };
  if (edited.includes("wishes")) next.wishes = previous.wishes;
  return next;
}

/** Hand-filling the fact a question asks for retires the card. */
export function dismissAnsweredQuestion(intent: Intent, edited: readonly UserEdit[]): Intent {
  if (!intent.question) return intent;
  if (!edited.includes(intent.question.field)) return intent;
  if (!fieldIsFilled(intent, intent.question.field)) return intent;
  return { ...intent, question: null };
}
