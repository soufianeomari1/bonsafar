"use client";

import { LayoutGroup } from "motion/react";
import { AgentRunProvider } from "@/lib/agent-client/context";

/** Screens 04 to 08 share one run. The layout group lets a result card grow into the package. */
export default function TripLayout({ children }: { children: React.ReactNode }) {
  return (
    <AgentRunProvider>
      <LayoutGroup>{children}</LayoutGroup>
    </AgentRunProvider>
  );
}
