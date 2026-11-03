import Link from "next/link";
import { AirplaneTilt } from "@phosphor-icons/react/dist/ssr";
import { Clouds } from "@/components/bs/Clouds";
import { MobileFrame } from "@/components/layout/MobileFrame";

/**
 * Holding page until screen 0 lands in block 2. English on purpose: anyone
 * reaching bonsafar.com before the demo is a judge or a reader of the README.
 */
export default function Home() {
  return (
    <MobileFrame surfaceClassName="bg-sky-gradient" lang="en" dir="ltr">
      <Clouds />

      <main className="relative flex flex-1 flex-col justify-center gap-4 px-5 py-8">
        <span className="flex size-16 items-center justify-center rounded-[18px] bg-ink text-card shadow-soft">
          <AirplaneTilt size={36} weight="fill" />
        </span>

        <div className="flex items-baseline gap-2">
          <h1 className="text-[22px] font-extrabold tracking-tight">BonSafar</h1>
          <span className="text-[15px] italic text-muted">trik slama</span>
        </div>

        <p className="text-[32px] font-extrabold leading-[1.06] tracking-tight">
          A travel agency
          <br />
          in your pocket.
        </p>
        <p className="text-[17px] leading-relaxed text-muted">
          Say your trip out loud, in Moroccan darija. We prepare everything, at
          the real price.
        </p>

        <p className="mt-2 font-mono text-xs uppercase tracking-[0.08em] text-muted">
          Building in public for the Meta Global AI Developer Hackathon
        </p>
      </main>

      <footer className="relative flex flex-col gap-2 px-5 pb-8 text-[15px]">
        <Link href="/dev/kit" className="font-semibold underline underline-offset-4">
          Design kit
        </Link>
        <div className="flex gap-4 text-muted">
          <Link href="/privacy" className="underline underline-offset-4">
            Privacy
          </Link>
          <Link href="/terms" className="underline underline-offset-4">
            Terms
          </Link>
        </div>
      </footer>
    </MobileFrame>
  );
}
