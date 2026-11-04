import type { TranslationKey } from "@/lib/i18n";
import type { Profile } from "@/lib/profile/schema";

/**
 * Trip ideas of the home screen. Illustrations in public/ideas are Muse Image
 * landscapes (see public/ideas/prompts.json). `generated` is true only when
 * that file is a real generation, which is what shows the Muse Image badge.
 */
export type Idea = {
  id: "istanbul" | "paris" | "omra" | "tunis" | "barcelona";
  title: TranslationKey;
  /** Subtitle when the profile needs a visa, and when it does not. */
  sub: TranslationKey;
  subFree?: TranslationKey;
  image: string;
  /** Gradient stand-in when no Muse Image file is wired up. */
  wash: string;
  /** Schengen ideas are only visa-free for French passports or visa holders. */
  schengen: boolean;
  generated: boolean;
};

const IDEAS: Record<Idea["id"], Idea> = {
  istanbul: {
    id: "istanbul",
    title: "idea.istanbul.title",
    sub: "idea.istanbul.sub",
    image: "/ideas/istanbul.webp",
    wash: "bg-gradient-to-br from-yellow via-orange to-blue",
    schengen: false,
    generated: true,
  },
  paris: {
    id: "paris",
    title: "idea.paris.title",
    sub: "idea.paris.sub",
    subFree: "idea.paris.subFree",
    image: "/ideas/paris.webp",
    wash: "bg-gradient-to-br from-blue-soft via-blue to-ink",
    schengen: true,
    generated: true,
  },
  omra: {
    id: "omra",
    title: "idea.omra.title",
    sub: "idea.omra.sub",
    image: "/ideas/omra.webp",
    wash: "bg-gradient-to-br from-yellow to-orange",
    schengen: false,
    generated: true,
  },
  tunis: {
    id: "tunis",
    title: "idea.tunis.title",
    sub: "idea.tunis.sub",
    image: "/ideas/tunis.webp",
    wash: "bg-gradient-to-br from-sea to-blue",
    schengen: false,
    generated: true,
  },
  barcelona: {
    id: "barcelona",
    title: "idea.barcelona.title",
    sub: "idea.barcelona.sub",
    subFree: "idea.barcelona.subFree",
    image: "/ideas/barcelona.webp",
    wash: "bg-gradient-to-br from-land to-green",
    schengen: true,
    generated: true,
  },
};

export function schengenFree(profile: Profile): boolean {
  return (
    profile.has_schengen ||
    profile.passport_country === "fr" ||
    profile.passport_country === "both"
  );
}

/** Green subtitle on an idea card: the card is visa-free for this profile. */
export function cardVisaFree(idea: Idea, sub: TranslationKey): boolean {
  return !idea.schengen || sub === idea.subFree;
}

function subFor(idea: Idea, profile: Profile): TranslationKey {
  return schengenFree(profile) && idea.subFree ? idea.subFree : idea.sub;
}

/**
 * Without Schengen access, visa-free ideas come first and a single Schengen
 * dream stays, with the visa named in its subtitle (docs section 5).
 */
export function ideasFor(profile: Profile): { idea: Idea; sub: TranslationKey }[] {
  const order: Idea["id"][] = schengenFree(profile)
    ? ["paris", "istanbul", "barcelona"]
    : ["istanbul", "paris", "omra"];
  return order.map((id) => {
    const idea = IDEAS[id];
    return { idea, sub: subFor(idea, profile) };
  });
}

/** Home-carousel ideas whose card is visa-free for this profile, in that order. */
export function visaFreeHomeIds(profile: Profile): Idea["id"][] {
  return ideasFor(profile)
    .filter(({ idea, sub }) => cardVisaFree(idea, sub))
    .map(({ idea }) => idea.id);
}

/** A catalog idea (including ones the carousel hides) under the same card rule. */
export function knownIdeaVisaFree(id: Idea["id"], profile: Profile): boolean {
  const idea = IDEAS[id];
  return cardVisaFree(idea, subFor(idea, profile));
}
