"use client";

import { IconContext } from "@phosphor-icons/react";

const LIGHT = { weight: "light" } as const;

/** One icon family across the app: Phosphor, light weight, unless a screen asks otherwise. */
export function IconDefaults({ children }: { children: React.ReactNode }) {
  return <IconContext.Provider value={LIGHT}>{children}</IconContext.Provider>;
}
