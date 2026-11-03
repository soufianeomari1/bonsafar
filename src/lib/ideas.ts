import type { TranslationKey } from "@/lib/i18n";
import type { Profile } from "@/lib/profile/schema";

/**
 * Trip ideas of the home screen. The images in public/ideas are PROVISIONAL
 * hand-drawn SVGs, to be replaced by Muse Image illustrations.
 */
export type Idea = {
  id: "istanbul" | "paris" | "omra" | "tunis" | "barcelona";
  title: TranslationKey;
  /** Subtitle when the profile needs a visa, and when it does not. */
  sub: TranslationKey;
  subFree?: TranslationKey;
  image: string;
  /** Gradient stand-in until a Muse Image illustration exists. */
  wash: string;
  /** Schengen ideas are only visa-free for French passports or visa holders. */
  schengen: boolean;
  provisional: true;
};

const IDEAS: Record<Idea["id"], Idea> = {
  istanbul: {
    id: "istanbul",
    title: "idea.istanbul.title",
    sub: "idea.istanbul.sub",
    image: "/ideas/istanbul.svg",
    wash: "bg-gradient-to-br from-yellow via-orange to-blue",
    schengen: false,
    provisional: true,
  },
  paris: {
    id: "paris",
    title: "idea.paris.title",
    sub: "idea.paris.sub",
    subFree: "idea.paris.subFree",
    image: "/ideas/paris.svg",
    wash: "bg-gradient-to-br from-blue-soft via-blue to-ink",
    schengen: true,
    provisional: true,
  },
  omra: {
    id: "omra",
    title: "idea.omra.title",
    sub: "idea.omra.sub",
    image: "/ideas/omra.svg",
    wash: "bg-gradient-to-br from-yellow to-orange",
    schengen: false,
    provisional: true,
  },
  tunis: {
    id: "tunis",
    title: "idea.tunis.title",
    sub: "idea.tunis.sub",
    image: "/ideas/tunis.svg",
    wash: "bg-gradient-to-br from-sea to-blue",
    schengen: false,
    provisional: true,
  },
  barcelona: {
    id: "barcelona",
    title: "idea.barcelona.title",
    sub: "idea.barcelona.sub",
    subFree: "idea.barcelona.subFree",
    image: "/ideas/barcelona.svg",
    wash: "bg-gradient-to-br from-land to-green",
    schengen: true,
    provisional: true,
  },
};

export function schengenFree(profile: Profile): boolean {
  return (
    profile.has_schengen ||
    profile.passport_country === "fr" ||
    profile.passport_country === "both"
  );
}

/**
 * Without Schengen access, visa-free ideas come first and a single Schengen
 * dream stays, with the visa named in its subtitle (docs section 5).
 */
export function ideasFor(profile: Profile): { idea: Idea; sub: TranslationKey }[] {
  const free = schengenFree(profile);
  const order: Idea["id"][] = free
    ? ["paris", "istanbul", "barcelona"]
    : ["istanbul", "paris", "omra"];
  return order.map((id) => {
    const idea = IDEAS[id];
    return { idea, sub: free && idea.subFree ? idea.subFree : idea.sub };
  });
}
