/** Safe on both sides: names only, no secret. */

/** httpOnly, HMAC-signed with JURY_ACCESS_KEY. The only proof of jury access. */
export const JURY_COOKIE = "bs_jury";

/**
 * Readable mirror of JURY_COOKIE for the interface only. The proxy sets it
 * when the signed cookie verifies and deletes it otherwise, on every request,
 * so a hand-made copy does not survive the next page load. Every API route
 * checks the signed cookie itself.
 */
export const JURY_UI_COOKIE = "bs_jury_ui";

export const JURY_MAX_AGE_S = 7 * 24 * 60 * 60;

/** postMessage channel between /jury and the app inside its phone frame. */
export const JURY_CHANNEL = "bonsafar-jury";
