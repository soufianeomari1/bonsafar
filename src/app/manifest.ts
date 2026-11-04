import type { MetadataRoute } from "next";
import { TOKENS } from "@/lib/tokens";

/** Installable BonSafar: opens on the home screen, full screen, Safar as the icon. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/home",
    name: "BonSafar",
    short_name: "BonSafar",
    description: "A travel agency in your pocket, that understands Moroccan darija.",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: TOKENS.bg,
    background_color: TOKENS.bg,
    lang: "fr",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
