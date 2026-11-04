"use client";

import { Safar } from "@/components/bs/Safar";
import { TripShell } from "@/components/trip/TripShell";
import { useT } from "@/lib/i18n/provider";

/** Screen 08 is the next block. The run is already here when it arrives. */
export default function ReadyPage() {
  const t = useT();
  return (
    <TripShell>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-gradient-to-b from-sky to-bg px-8 text-center">
        <Safar state="idle" size={110} />
        <h1 className="text-[28px] font-extrabold tracking-tight">{t("ready.title")}</h1>
        <p className="text-[17px] text-muted">{t("ready.soon")}</p>
      </div>
    </TripShell>
  );
}
