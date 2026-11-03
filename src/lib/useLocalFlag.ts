"use client";

import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function read(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

/**
 * A boolean kept in localStorage (trust card seen...). `null` on the server
 * and before hydration, so screens can wait instead of flashing.
 */
export function useLocalFlag(key: string): [boolean | null, (value: boolean) => void] {
  const value = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => read(key),
    () => null
  );
  const write = useCallback(
    (next: boolean) => {
      try {
        if (next) window.localStorage.setItem(key, "1");
        else window.localStorage.removeItem(key);
      } catch {
        // Storage blocked: the flag lasts until the next reload.
      }
      for (const listener of listeners) listener();
    },
    [key]
  );
  return [value, write];
}
