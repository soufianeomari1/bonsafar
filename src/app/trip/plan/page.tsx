import { FlightPlanScreen } from "@/components/trip/FlightPlanScreen";
import { TripShell } from "@/components/trip/TripShell";

/** Screen 05, the agent's flight plan. */
export default function PlanPage() {
  return (
    <TripShell>
      <FlightPlanScreen />
    </TripShell>
  );
}
