import { formatAmount } from "@/lib/format";

/**
 * The English gloss keeps the traveller's budget out of the model text.
 * `{budget}` is filled here, in the target language. Any other `{marker}`
 * is dropped, so braces never reach the screen.
 */
export function fillBudgetMarker(text: string, budgetMad: number | null): string {
  const phrase =
    budgetMad != null && budgetMad > 0 ? `${formatAmount(budgetMad, "en")} DH` : "a budget";
  const filled = text
    .replace(/\ba\s*\{budget\}\s*budget\b/gi, phrase)
    .replaceAll("{budget}", phrase);
  return filled.replace(/\{[^{}]+\}/g, "").replace(/[ \t]{2,}/g, " ").trim();
}
