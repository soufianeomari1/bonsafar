import { ReadyScreen } from "@/components/trip/ReadyScreen";
import { TripShell } from "@/components/trip/TripShell";
import { serverEnv } from "@/lib/env";

/** Screen 08. The allowance is read here, the same way as the package. */
export default function ReadyPage() {
  return (
    <TripShell>
      <ReadyScreen dotationMad={serverEnv().DOTATION_MAD} />
    </TripShell>
  );
}
