import { MobileFrame } from "@/components/layout/MobileFrame";
import { AccountScreen } from "@/components/screens/AccountScreen";

/** "Mon espace": identity, trips, alerts, preferences and data. */
export default function AccountPage() {
  return (
    <MobileFrame>
      <AccountScreen />
    </MobileFrame>
  );
}
