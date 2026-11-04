import { packageOptionId } from "@/lib/agent-client/store";
import type { AgentPackage, PackageOption } from "@/lib/agent/schema";
import type { FlightOffer, HotelOffer, Offer } from "@/lib/prices/store";

/** The option opened from the result, or the recommended one. */
export function pickOption(result: AgentPackage | null, selectedId: string | null): PackageOption | null {
  if (!result) return null;
  if (!selectedId) return result.recommended;
  const all = [result.recommended, ...result.alternatives];
  return all.find((option) => packageOptionId(option.flight_id, option.hotel_id) === selectedId) ?? result.recommended;
}

export function asFlight(offer: Offer | undefined): FlightOffer | null {
  return offer?.kind === "flight" ? offer : null;
}

export function asHotel(offer: Offer | undefined): HotelOffer | null {
  return offer?.kind === "hotel" ? offer : null;
}
