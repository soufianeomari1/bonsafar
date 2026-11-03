import { MobileFrame } from "@/components/layout/MobileFrame";
import { OnboardingScreen } from "@/components/screens/OnboardingScreen";

export default function OnboardingPage() {
  return (
    <MobileFrame surfaceClassName="bg-card">
      <OnboardingScreen />
    </MobileFrame>
  );
}
