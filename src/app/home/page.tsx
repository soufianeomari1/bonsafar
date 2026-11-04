import { MobileFrame } from "@/components/layout/MobileFrame";
import { HomeScreen } from "@/components/screens/HomeScreen";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ ideas?: string | string[] }>;
}) {
  const ideas = (await searchParams).ideas;
  const visaFreeOnly = ideas === "visa-free" || (Array.isArray(ideas) && ideas.includes("visa-free"));
  return (
    <MobileFrame surfaceClassName="bg-bg">
      <HomeScreen visaFreeOnly={visaFreeOnly} />
    </MobileFrame>
  );
}
