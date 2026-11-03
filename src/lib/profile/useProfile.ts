"use client";

import { useSyncExternalStore } from "react";
import {
  readProfileState,
  readServerProfileState,
  signInWithGoogle,
  signOut,
  subscribeToProfile,
  updateProfile,
} from "./store";

/** The traveller profile, from Supabase when signed in, else from this phone. */
export function useProfile() {
  const state = useSyncExternalStore(
    subscribeToProfile,
    readProfileState,
    readServerProfileState
  );
  return {
    ...state,
    ready: state.status === "ready",
    update: updateProfile,
    signInWithGoogle,
    signOut,
  };
}
