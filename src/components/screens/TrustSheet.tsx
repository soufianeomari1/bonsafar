"use client";

import { useEffect, useRef, useState } from "react";
import { AirplaneTilt, ShieldCheck, Wallet } from "@phosphor-icons/react";
import { useReducedMotion } from "motion/react";
import { Button } from "@/components/bs/Button";
import { ProgressSegments } from "@/components/bs/Choice";
import { IconCircle } from "@/components/bs/IconCircle";
import { RichText } from "@/components/bs/Brand";
import { SafarBubble } from "@/components/bs/Safar";
import { Sheet } from "@/components/bs/Sheet";
import { useT } from "@/lib/i18n/provider";

const POINTS = [
  { key: "trust.point.live", icon: AirplaneTilt, tone: "blue" },
  { key: "trust.point.total", icon: Wallet, tone: "orange" },
  { key: "trust.point.partner", icon: ShieldCheck, tone: "green" },
] as const;

/** Screen 1 ter, the trust card. Safar switches to found when "Mfhoum" is tapped. */
export function TrustSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const reduced = useReducedMotion();
  const [found, setFound] = useState(false);
  const [trackedOpen, setTrackedOpen] = useState(open);
  const timer = useRef<number | null>(null);

  if (open !== trackedOpen) {
    setTrackedOpen(open);
    if (open) setFound(false);
  }

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    []
  );

  function confirm() {
    if (found) return;
    setFound(true);
    timer.current = window.setTimeout(onClose, reduced ? 200 : 700);
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("trust.title")}
      hideTitle
      className="flex flex-col gap-4 px-[22px] pt-[18px]"
    >
      <SafarBubble state={found ? "found" : "idle"} size={64}>
        <p className="text-[17px] font-bold leading-snug">{t("trust.title")}</p>
        <p className="mt-1 text-sm leading-snug text-muted">{t("trust.subtitle")}</p>
      </SafarBubble>
      <ul className="flex flex-col gap-3.5">
        {POINTS.map((point) => (
          <li key={point.key} className="grid grid-cols-[40px_minmax(0,1fr)] items-center gap-3">
            <IconCircle icon={point.icon} tone={point.tone} size={40} />
            <span className="text-base leading-[1.4]">
              <RichText text={t(point.key)} />
            </span>
          </li>
        ))}
      </ul>
      <ProgressSegments total={3} done={3} />
      <Button full feedback={null} onClick={confirm} className="font-bold">
        {t("trust.cta")}
      </Button>
    </Sheet>
  );
}
