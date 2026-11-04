import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { JuryBoard } from "@/components/jury/JuryBoard";
import { verifyJuryToken } from "@/lib/jury/access";
import { JURY_COOKIE } from "@/lib/jury/flags";

export const metadata: Metadata = {
  title: "BonSafar · Judges' demo",
  robots: { index: false, follow: false, nocache: true },
};

/** Hidden judges' board. The proxy already sends visitors without the signed cookie home. */
export default function JuryPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-sky-gradient" />}>
      <Gate />
    </Suspense>
  );
}

function silenceMs(): number {
  const value = Number(process.env.JURY_SILENCE_MS);
  return Number.isInteger(value) && value > 0 ? value : 15_000;
}

async function Gate() {
  await connection();
  const store = await cookies();
  if (!(await verifyJuryToken(store.get(JURY_COOKIE)?.value))) redirect("/");
  return <JuryBoard silenceMs={silenceMs()} videoUrl={process.env.NEXT_PUBLIC_DEMO_VIDEO_URL || null} />;
}
