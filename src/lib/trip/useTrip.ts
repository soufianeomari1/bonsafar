"use client";

import { useSyncExternalStore } from "react";
import { readServerTrip, readTrip, subscribeToTrip } from "./store";

export function useTrip() {
  return useSyncExternalStore(subscribeToTrip, readTrip, readServerTrip);
}
