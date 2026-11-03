import { MobileFrame } from "@/components/layout/MobileFrame";
import { ProfileScreen } from "@/components/screens/ProfileScreen";

export default function ProfilePage() {
  return (
    <MobileFrame surfaceClassName="bg-card">
      <ProfileScreen />
    </MobileFrame>
  );
}
