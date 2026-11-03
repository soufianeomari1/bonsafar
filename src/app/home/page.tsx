import { MobileFrame } from "@/components/layout/MobileFrame";
import { HomeScreen } from "@/components/screens/HomeScreen";

export default function HomePage() {
  return (
    <MobileFrame surfaceClassName="bg-bg">
      <HomeScreen />
    </MobileFrame>
  );
}
