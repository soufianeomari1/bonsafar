/**
 * Reference dictionary. Every other language is a partial of this one and
 * falls back here when a key is missing. Keys are always English.
 */
export const en = {
  // Shared controls
  "common.next": "Next",
  "common.skip": "Skip",
  "common.back": "Back",
  "common.close": "Close",
  "common.cancel": "Cancel",
  "common.retry": "Try again",
  "common.share": "Share",
  "common.understood": "Got it",
  "common.juryMode": "Judges' mode",
  "common.signIn": "Continue with Google",
  "common.signOut": "Sign out",
  "common.signedInAs": "Signed in as {name}",
  "common.signedOut": "Not signed in",
  "common.loading": "One more moment",

  // 0 · Welcome and sign-in
  "welcome.tagline": "trik slama",
  "welcome.title": "A travel agency in your pocket.",
  "welcome.subtitle":
    "Say your trip out loud. We prepare everything, at the real price.",
  "welcome.perk.language": "Speak in darija, French or Arabic",
  "welcome.perk.live": "Live flights and hotels, one single price in dirhams",
  "welcome.perk.checks": "Visa, baggage, money: all checked before you leave",
  "welcome.noAccount": "Continue without an account",
  "welcome.footnote": "Then 4 questions, 30 seconds, to tailor your trips.",

  // 1 · Profile, 4 steps
  "onboarding.step": "Step {current} of {total}",
  "onboarding.language.title": "You'd rather we speak…",
  "onboarding.language.subtitle": "You can always mix, BonSafar understands.",
  "onboarding.language.scriptLabel": "Write darija in",
  "onboarding.language.scriptLatin": "Latin letters",
  "onboarding.language.scriptArabic": "Arabic letters",
  "onboarding.papers.title": "Your papers",
  "onboarding.papers.subtitle":
    "So we only suggest trips you can really take.",
  "onboarding.papers.passportLabel": "Your passport",
  "onboarding.papers.schengen": "Valid Schengen visa",
  "onboarding.papers.schengenHint": "Opens France, Spain, Italy and more",
  "onboarding.papers.passport6m": "Passport valid over 6 months",
  "onboarding.papers.passport6mHint": "Required by many airlines",
  "onboarding.papers.card": "International bank card",
  "onboarding.papers.cardHint": "To pay on the partner's site",
  "onboarding.papers.note":
    "Without a Schengen visa I show you visa-free countries first, and explain how to apply for the Schengen.",
  "passport.moroccan": "Moroccan",
  "passport.french": "French",
  "passport.both": "Both",
  "passport.other": "Other",

  // 1 ter · Trust card
  "trust.title": "The real price, right away.",
  "trust.subtitle": "What you see is what you pay, in dirhams.",
  "trust.point.live": "Live flights and hotels, from partners you know.",
  "trust.point.total": "One total price, everything included, no surprise.",
  "trust.point.partner":
    "You pay on the partner's site. BonSafar never touches your money.",

  // 2 · Home
  "home.title": "Salam! Where do you want to travel?",
  "home.subtitle": "Tell me where you want to go, I take care of the rest.",
  "home.micLabel": "Press and speak",
  "home.micTitle": "Press and speak",
  "home.micHint": "Press and speak, in darija or in French",
  "home.ideasLabel": "Trip ideas",
  "home.writeLabel": "Write your request",
  "home.writePlaceholder": "or write here…",

  // Language names, shown in their own language
  "lang.darija-latn": "Darija",
  "lang.darija-arab": "Darija",
  "lang.fr": "Français",
  "lang.ar": "العربية",
  "lang.en": "English",
  "lang.sample.darija-latn": "Salam! Labas?",
  "lang.sample.darija-arab": "سلام! لاباس؟",
  "lang.sample.fr": "Bonjour !",
  "lang.sample.ar": "مرحبا !",
  "lang.sample.en": "Hello!",
} as const;

export type TranslationKey = keyof typeof en;
export type Dictionary = Partial<Record<TranslationKey, string>>;
