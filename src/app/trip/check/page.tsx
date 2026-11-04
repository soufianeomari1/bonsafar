import { CheckScreen } from "@/components/trip/CheckScreen";
import { TripShell } from "@/components/trip/TripShell";
import { serverEnv } from "@/lib/env";

/** Screen 09, check and continue. */
export default function CheckPage() {
  return (
    <TripShell>
      <CheckScreen dotationMad={serverEnv().DOTATION_MAD} />
    </TripShell>
  );
}
