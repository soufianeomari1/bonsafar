import type { Metadata } from "next";

/** Developer benches. In production the proxy answers 404 without the jury cookie. */
export const metadata: Metadata = {
  title: "BonSafar · dev",
  robots: { index: false, follow: false },
};

export default function DevLayout({ children }: LayoutProps<"/dev">) {
  return children;
}
