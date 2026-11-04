import { PackageScreen } from "@/components/trip/PackageScreen";
import { TripShell } from "@/components/trip/TripShell";
import { serverEnv } from "@/lib/env";

/** Screen 07. The allowance is read here and never written into the client bundle as a literal. */
export default function PackagePage() {
  return (
    <TripShell>
      <PackageScreen dotationMad={serverEnv().DOTATION_MAD} />
    </TripShell>
  );
}
