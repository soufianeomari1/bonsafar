import { TravelFileScreen } from "@/components/trip/TravelFileScreen";
import { TripShell } from "@/components/trip/TripShell";
import { serverEnv } from "@/lib/env";

/** Screen 10, the printed travel file. */
export default function FilePage() {
  return (
    <TripShell>
      <TravelFileScreen dotationMad={serverEnv().DOTATION_MAD} />
    </TripShell>
  );
}
