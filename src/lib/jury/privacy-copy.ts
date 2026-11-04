import type { Lang } from "@/lib/i18n";

/**
 * /privacy section on live searches and the per-person limit, in the five
 * interface languages (to move into the dictionaries later).
 */
export const LIVE_CREDITS_COPY: Record<Lang, { title: string; body: string }> = {
  en: {
    title: "Live searches and fair use",
    body: "Live searches run on Meta Model API credits. To keep BonSafar free for everyone, each person can run a limited number of live searches per hour. Your IP address is never stored: only a salted fingerprint of it is used for the count.",
  },
  fr: {
    title: "Recherches en direct et usage équitable",
    body: "Les recherches en direct utilisent les crédits de la Meta Model API. Pour garder BonSafar gratuit pour tout le monde, chaque personne a droit à un nombre limité de recherches en direct par heure. Ton adresse IP n'est jamais stockée : seule une empreinte salée sert à compter.",
  },
  "darija-latn": {
    title: "L'recherches f direct w l'limite",
    body: "L'recherches f direct katkhdem b l'crédits dyal Meta Model API. Bach BonSafar yb9a fabor l ga3 nas, kol wa7ed 3ando 3adad m7dod dyal l'recherches f direct f sa3a. L'adresse IP dyalek ma kattsejjelch: ghir empreinte mchefra katsta3mel bach n7esbo.",
  },
  "darija-arab": {
    title: "البحث المباشر والحد ديالو",
    body: "البحث المباشر خدام بالكريدي ديال Meta Model API. باش يبقى BonSafar فابور لكاع الناس، كل واحد عندو عدد محدود ديال البحوث المباشرة فالساعة. العنوان IP ديالك ما كيتسجلش: غير بصمة مشفرة كتستعمل باش نحسبو.",
  },
  ar: {
    title: "البحث المباشر والاستخدام العادل",
    body: "تستخدم عمليات البحث المباشر أرصدة Meta Model API. وللحفاظ على مجانية BonSafar للجميع، يحق لكل شخص عدد محدود من عمليات البحث المباشر في الساعة. لا نخزّن عنوان IP الخاص بك أبدًا: نستخدم فقط بصمة مشفّرة منه لأغراض العدّ.",
  },
};
