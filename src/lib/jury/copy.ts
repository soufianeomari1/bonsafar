import type { Lang } from "@/lib/i18n";

/**
 * Judges' board copy. The board is English only, so it lives here and not in
 * the five dictionaries. GUARD_COPY is the exception: travellers read it, in
 * their own language (to move into the dictionaries later).
 */

export const JURY_LINKS = {
  github: "https://github.com/soufianeomari1/bonsafar",
} as const;

export const JURY_COPY = {
  badge: "Judges' demo",
  github: "GitHub",
  video: "3-min video",
  title: "A travel agency in your pocket, that understands Moroccan darija.",

  personaKicker: "Your traveller",
  personaTitle: "Meet Fatima, 52, Casablanca",
  personaBubble: "She speaks darija. I handle the trip.",
  personaChips: ["From CMN", "Moroccan passport", "No Schengen visa", "Travels with her husband"],

  impactLabel: "Why it matters",
  impact: [
    { value: "619,827", label: "Schengen visa applications filed in Morocco in 2025" },
    { value: "19.2%", label: "of them refused" },
    { value: "5th", label: "country in the world for applications" },
  ],
  impactSource: "Source: European Commission visa statistics, released May 28, 2026.",

  scenariosLabel: "Three real voice notes",
  runLive: "Run live",
  watchReplay: "Watch replay",
  running: "Running…",
  play: "Play the voice note",
  pause: "Pause the voice note",
  audioSoon: "Audio coming soon",
  audioSoonHint: "The voice note is being recorded. Watch the replay meanwhile.",
  replayNone: "No recording yet",
  replayFrom: (when: string) => `Replay captured ${when}`,
  replayLegacy: (when: string) => `Replay of an earlier run, captured ${when}`,
  livePaused: "Live paused: the demo spend cap is reached. Replays only.",

  ownTitle: "Record your own",
  ownBody: "Hold the mic in the phone and speak darija, French or English.",
  ownCta: "Record your own",
  ownHint: "Hold the blue mic in the phone, speak, release. Same pipeline, same panel.",
  onboardingTitle: "See her 30-second onboarding",
  onboardingBody: "The four profile steps BonSafar asked Fatima, sped up.",
  onboardingCta: "Play the onboarding",

  steps: [
    "Voice note in darija",
    "What BonSafar understood",
    "Live flight plan",
    "One package one price",
    "Ready-to-go travel file",
  ],
  stepsLabel: "Guided demo",
  phoneLabel: "BonSafar app, live",
  reset: "Reset the phone",

  replayBadge: "Replay",
  capturedAt: (when: string) => `Prices captured ${when}`,
  recordedLive: (time: string, cost: string) => `recorded live: ${time}, ${cost}`,
  fallback: {
    silence: (seconds: number) => `The live stream went quiet for ${seconds} s. Switched to the recorded run.`,
    error: "The live run hit an error. Switched to the recorded run.",
    network: "The connection dropped. Switched to the recorded run.",
    limit: "Live runs are capped right now. Showing the recorded run.",
  },

  endTitle: "Trip ready",
  endSubtitle: "Voice note in, travel file out.",
  endTime: "Total time",
  endCost: "Total AI cost",
  endCaptured: "Prices captured",
  endModels: "Meta models used",
  endCalls: (count: number) => (count === 1 ? "1 call" : `${count} calls`),
  endTools: "Live data tools (Kiwi.com, trivago)",
  endReplayNote: "Replay: the time and cost are those measured during the recorded live run.",
  endNext: (title: string) => `Try scenario ${title}`,
  endClose: "Close the summary",

  onboarding: [
    { question: "Which language do you speak with me?", answer: "Darija, in Latin letters" },
    { question: "Where do you fly from?", answer: "Casablanca, CMN" },
    { question: "Who do you travel with?", answer: "With my husband" },
    { question: "Which papers do you have?", answer: "Moroccan passport, no Schengen visa" },
  ],
  onboardingStep: (index: number) => `Step ${index} of 4`,
  onboardingDone: "Profile saved. No sign-in needed.",

  hood: {
    replayTag: "replay",
  },
} as const;

export type GuardCode = "rate_limited" | "spend_limit";

/** What a traveller reads when a live search is refused. */
export const GUARD_COPY: Record<GuardCode, Record<Lang, string>> = {
  rate_limited: {
    en: "You have reached 10 live searches this hour. This limit keeps BonSafar free for everyone. Try again a little later.",
    fr: "Tu as atteint 10 recherches en direct cette heure-ci. Cette limite garde BonSafar gratuit pour tout le monde. Réessaie un peu plus tard.",
    "darija-latn":
      "Wselti l 10 dyal l'recherches f direct f had sa3a. Had l'limite katkhelli BonSafar fabor l ga3 nas. 3awed men b3d chwiya.",
    "darija-arab":
      "وصلتي ل 10 ديال البحوث المباشرة فهاد الساعة. هاد الحد كيخلي BonSafar فابور لكاع الناس. عاود من بعد شوية.",
    ar: "لقد بلغت 10 عمليات بحث مباشر في هذه الساعة. يحافظ هذا الحد على مجانية BonSafar للجميع. حاول مجددًا بعد قليل.",
  },
  spend_limit: {
    en: "Live searches are paused for now: the free demo credits are used up. Please come back later.",
    fr: "Les recherches en direct sont en pause : les crédits gratuits de la démo sont épuisés. Reviens plus tard.",
    "darija-latn": "L'recherches f direct w9fin daba: l'crédits l fabor dyal la démo salaw. Rje3 men b3d.",
    "darija-arab": "البحث المباشر واقف دابا: الكريدي ديال الديمو الفابور سالا. رجع من بعد.",
    ar: "البحث المباشر متوقف حاليًا: نفدت الأرصدة المجانية للعرض التجريبي. يُرجى العودة لاحقًا.",
  },
};

export const GUARD_DISMISS: Record<Lang, string> = {
  en: "Close",
  fr: "Fermer",
  "darija-latn": "Sedd",
  "darija-arab": "سد",
  ar: "إغلاق",
};
