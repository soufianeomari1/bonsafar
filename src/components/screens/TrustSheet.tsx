"use client";

import { AirplaneTilt, SealCheck, ShieldCheck, Wallet } from "@phosphor-icons/react";
import { Button } from "@/components/bs/Button";
import { ProgressSegments } from "@/components/bs/Choice";
import { IconCircle } from "@/components/bs/IconCircle";
import { RichText } from "@/components/bs/Brand";
import { Sheet } from "@/components/bs/Sheet";
import { useT } from "@/lib/i18n/provider";

const POINTS = [
  { key: "trust.point.live", icon: AirplaneTilt, tone: "blue" },
  { key: "trust.point.total", icon: Wallet, tone: "orange" },
  { key: "trust.point.partner", icon: ShieldCheck, tone: "green" },
] as const;

/** Screen 1 ter, mockup 01c-Confiance, over the home screen. */
export function TrustSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  return (
    <Sheet open={open} onClose={onClose} title={t("trust.title")} hideTitle className="flex flex-col gap-4 px-[22px] pt-[18px]">
      <span className="flex size-[104px] items-center justify-center self-center rounded-pill bg-green-soft text-green">
        <SealCheck size={58} weight="fill" aria-hidden />
      </span>
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-[26px] font-extrabold tracking-[-0.02em]">{t("trust.title")}</h2>
        <p className="max-w-80 text-[17px] leading-[1.45] text-muted">{t("trust.subtitle")}</p>
      </div>
      <ul className="mt-1 flex flex-col gap-3.5">
        {POINTS.map((point) => (
          <li key={point.key} className="grid grid-cols-[40px_minmax(0,1fr)] items-center gap-3">
            <IconCircle icon={point.icon} tone={point.tone} size={40} />
            <span className="text-base leading-[1.4]">
              <RichText text={t(point.key)} />
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <ProgressSegments total={3} done={3} />
      </div>
      <Button full feedback="success" onClick={onClose}>
        {t("trust.cta")}
      </Button>
    </Sheet>
  );
}
