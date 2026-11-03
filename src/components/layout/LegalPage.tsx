import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";

export type LegalPageProps = {
  title: string;
  updated: string;
  children: React.ReactNode;
};

/** Shared shell for the short legal pages Google asks for. Always English. */
export function LegalPage({ title, updated, children }: LegalPageProps) {
  return (
    // These pages are English only, whatever language the profile is set to.
    <div lang="en" dir="ltr" className="flex min-h-dvh justify-center bg-fill py-10">
      <article className="mx-5 w-full max-w-[640px] rounded-sheet bg-card px-6 py-8 shadow-soft">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-[15px] font-semibold text-muted"
        >
          <CaretLeft size={16} weight="bold" />
          BonSafar
        </Link>

        <h1 className="mt-4 text-[32px] font-extrabold tracking-tight">
          {title}
        </h1>
        <p className="mt-1 font-mono text-xs uppercase tracking-[0.08em] text-muted">
          Updated {updated}
        </p>

        <div className="mt-6 flex flex-col gap-4 text-[16px] leading-relaxed [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-4 [&_h2]:text-[19px] [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2">
          {children}
        </div>
      </article>
    </div>
  );
}
