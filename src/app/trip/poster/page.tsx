import { PosterScreen } from "@/components/trip/PosterScreen";
import { TripShell } from "@/components/trip/TripShell";

/** Screen 10 bis, the shareable poster. */
export default function PosterPage() {
  return (
    <TripShell>
      <PosterScreen />
    </TripShell>
  );
}
