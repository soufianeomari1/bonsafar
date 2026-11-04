"use client";

import { useSyncExternalStore } from "react";
import { readJuryAccess, readJuryEmbedded } from "@/lib/i18n/store";

const subscribe = () => () => {};

/** Renders its children only for a browser with jury access, and never inside the /jury phone. */
export function JuryOnly({ children }: { children: React.ReactNode }) {
  const visible = useSyncExternalStore(
    subscribe,
    () => readJuryAccess() && !readJuryEmbedded(),
    () => false,
  );
  return visible ? <>{children}</> : null;
}
