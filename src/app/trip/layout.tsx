"use client";

import { useEffect } from "react";
import { LayoutGroup } from "motion/react";
import { AgentRunProvider } from "@/lib/agent-client/context";
import { startTripSync } from "@/lib/trip/saved";

/** Screens 04 to 10 share one run. The layout group lets a result card grow into the package. */
export default function TripLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    startTripSync();
  }, []);
  return (
    <AgentRunProvider>
      <LayoutGroup>{children}</LayoutGroup>
    </AgentRunProvider>
  );
}
