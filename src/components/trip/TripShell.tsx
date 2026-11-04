"use client";

import { usePathname } from "next/navigation";
import { JuryFrame } from "@/components/layout/JuryFrame";
import { MobileFrame } from "@/components/layout/MobileFrame";
import { useAgentRun } from "@/lib/agent-client/context";
import { useLanguage } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

const STAGES = [
  { href: "/home", label: "1 Voice" },
  { href: "/trip/understood", label: "2 Understood" },
  { href: "/trip/plan", label: "3 Flight plan" },
  { href: "/trip/package", label: "4 Package" },
  { href: "/trip/ready", label: "5 Travel file" },
] as const;

function stageIndex(pathname: string): number {
  if (pathname.startsWith("/trip/ready")) return 4;
  if (pathname.startsWith("/trip/package") || pathname.startsWith("/trip/result")) return 3;
  if (pathname.startsWith("/trip/plan") || pathname.startsWith("/trip/search")) return 2;
  if (pathname.startsWith("/trip/understood")) return 1;
  return 0;
}

function JuryHeader() {
  const pathname = usePathname();
  const run = useAgentRun();
  const current = stageIndex(pathname);
  const scenario = run.scenario ?? run.result?.destination.city ?? "Live run";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          BonSafar · judges&apos; demo
        </p>
        <p className="text-lg font-extrabold tracking-tight">{scenario}</p>
      </div>
      <ol className="flex flex-wrap gap-2">
        {STAGES.map((stage, index) => (
          <li key={stage.label}>
            <span
              className={cn(
                "inline-flex h-9 items-center rounded-pill px-3 text-sm font-semibold",
                index < current && "bg-ink text-card",
                index === current && "bg-blue text-card",
                index > current && "bg-card text-muted",
              )}
            >
              {stage.label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Phone on its own, or the judges' desktop frame with the live panel. */
export function TripShell({ children }: { children: React.ReactNode }) {
  const { jury } = useLanguage();
  if (!jury) {
    return <MobileFrame>{children}</MobileFrame>;
  }
  return (
    <JuryFrame header={<JuryHeader />}>
      {children}
    </JuryFrame>
  );
}
