"use client";

import { useEffect, createContext, useContext, useSyncExternalStore } from "react";
import { hydrateAgentRun, readAgentRun, readServerAgentRun, subscribeAgentRun, type AgentRunSnapshot } from "./store";

const AgentRunContext = createContext<AgentRunSnapshot | null>(null);

/** Holds the run above screens 05, 06 and 07 so a navigation does not restart it. */
export function AgentRunProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(subscribeAgentRun, readAgentRun, readServerAgentRun);
  useEffect(() => {
    hydrateAgentRun();
  }, []);
  return <AgentRunContext.Provider value={snapshot}>{children}</AgentRunContext.Provider>;
}

export function useAgentRun(): AgentRunSnapshot {
  const snapshot = useContext(AgentRunContext);
  if (!snapshot) {
    throw new Error("useAgentRun must be used inside AgentRunProvider.");
  }
  return snapshot;
}
