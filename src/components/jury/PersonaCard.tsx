import { AirplaneTakeoff, Heart, IdentificationCard, Prohibit } from "@phosphor-icons/react";
import { SafarBubble } from "@/components/bs/Safar";
import { JURY_COPY } from "@/lib/jury/copy";
import { cn } from "@/lib/utils";

const CHIP_ICONS = [AirplaneTakeoff, IdentificationCard, Prohibit, Heart] as const;

/** "Meet Fatima": a still Safar introduces her, then her prefilled profile. */
export function PersonaCard() {
  return (
    <section aria-labelledby="persona-title" className="rounded-card bg-card p-5 shadow-soft">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
        {JURY_COPY.personaKicker}
      </p>
      <h2 id="persona-title" className="mt-1 text-[22px] font-extrabold leading-tight tracking-[-0.02em]">
        {JURY_COPY.personaTitle}
      </h2>
      <SafarBubble still size={60} className="-ms-1 mt-2" bubbleClassName="mb-2 py-3">
        <p className="text-[15px] font-bold leading-snug">{JURY_COPY.personaBubble}</p>
      </SafarBubble>
      <ul className="mt-1 flex flex-wrap gap-1.5" aria-label="Her profile">
        {JURY_COPY.personaChips.map((label, index) => {
          const Icon = CHIP_ICONS[index];
          const warn = index === 2;
          return (
            <li
              key={label}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-pill border px-2.5 text-[13px] font-semibold",
                warn ? "border-orange-soft bg-orange-soft text-orange" : "border-line bg-bg text-ink",
              )}
            >
              <Icon size={16} weight="light" aria-hidden />
              {label}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** The three impact figures and their source. */
export function ImpactFigures() {
  return (
    <section aria-label={JURY_COPY.impactLabel} className="flex flex-col gap-2">
      <ul className="grid grid-cols-3 gap-2">
        {JURY_COPY.impact.map((figure) => (
          <li key={figure.value} className="flex flex-col gap-1 rounded-[18px] bg-card px-3 py-3 shadow-soft">
            <span className="text-[22px] font-extrabold leading-none tracking-[-0.02em] tabular-nums">
              {figure.value}
            </span>
            <span className="text-[11.5px] leading-snug text-muted">{figure.label}</span>
          </li>
        ))}
      </ul>
      <p className="px-1 text-[11px] leading-snug text-muted">{JURY_COPY.impactSource}</p>
    </section>
  );
}
