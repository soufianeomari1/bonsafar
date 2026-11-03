import { Suspense } from "react";
import { MobileFrame } from "@/components/layout/MobileFrame";
import { JuryPlaceholder } from "@/components/screens/JuryPlaceholder";
import { WelcomeScreen } from "@/components/screens/WelcomeScreen";

/** Screen 0, or the judges' entry point on `/?jury=1`. */
export default function Page({ searchParams }: PageProps<"/">) {
  return (
    <MobileFrame>
      <Suspense fallback={null}>
        <Entry searchParams={searchParams} />
      </Suspense>
    </MobileFrame>
  );
}

async function Entry({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const { jury } = await searchParams;
  return jury === "1" ? <JuryPlaceholder /> : <WelcomeScreen />;
}
