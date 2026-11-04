"use client";

import { useEffect } from "react";
import { listenForInstall } from "@/lib/pwa/install";

/** Keeps Chrome's install event for later, and registers the static-asset service worker in production. */
export function InstallRegistrar() {
  useEffect(() => {
    const stop = listenForInstall();
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // No offline cache: the app works the same online.
      });
    }
    return stop;
  }, []);
  return null;
}
