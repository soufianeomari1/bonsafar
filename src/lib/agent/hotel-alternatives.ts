const MAX_CARDS = 3;

export type HotelSwapLabel = "cheaper_hotel" | "better_hotel";

export type HotelCandidate = {
  id: string;
  city: string;
  nights: number;
  rating: number | null;
  reviews: number | null;
  /** Package total in dirhams for the recommended flight plus this hotel. */
  totalMad: number;
};

export type TakenAlternative = { flightId: string; hotelId: string; label: string };

const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

function enoughReviews(reviews: number | null): boolean {
  return reviews == null || reviews >= 100;
}

/**
 * Fills the option list up to 3 cards (the recommended one included) with a
 * cheaper hotel and a better-rated hotel on the same flight and the same stay.
 * The recommended card is not in `taken`; `room` is how many cards are still free.
 */
export function pickHotelAlternatives(input: {
  flightId: string;
  hotelId: string;
  city: string;
  nights: number;
  rating: number | null;
  totalMad: number;
  payingTravellers: number;
  taken: TakenAlternative[];
  hotels: HotelCandidate[];
}): { label: HotelSwapLabel; hotelId: string }[] {
  const room = MAX_CARDS - 1 - input.taken.length;
  if (room <= 0) return [];

  const city = fold(input.city);
  const pairs = new Set(input.taken.map((item) => `${item.flightId}:${item.hotelId}`));
  const labels = new Set(input.taken.map((item) => item.label));
  const sameStay = input.hotels.filter(
    (hotel) =>
      hotel.id !== input.hotelId &&
      fold(hotel.city) === city &&
      hotel.nights === input.nights &&
      !pairs.has(`${input.flightId}:${hotel.id}`),
  );

  const picked: { label: HotelSwapLabel; hotelId: string }[] = [];
  const people = Math.max(1, input.payingTravellers);

  if (!labels.has("cheaper_hotel")) {
    const cheaper = sameStay
      .filter((hotel) => (hotel.rating ?? 0) >= 8 && enoughReviews(hotel.reviews))
      .sort((a, b) => a.totalMad - b.totalMad)[0];
    if (cheaper) {
      const saved = input.totalMad - cheaper.totalMad;
      const minimum = Math.max(input.totalMad * 0.05, 150 * people);
      if (saved >= minimum) {
        picked.push({ label: "cheaper_hotel", hotelId: cheaper.id });
        pairs.add(`${input.flightId}:${cheaper.id}`);
        labels.add("cheaper_hotel");
      }
    }
  }

  if (picked.length < room && !labels.has("better_hotel")) {
    const floor = (input.rating ?? 0) + 0.3;
    const better = sameStay
      .filter(
        (hotel) =>
          !pairs.has(`${input.flightId}:${hotel.id}`) &&
          (hotel.rating ?? 0) >= floor &&
          enoughReviews(hotel.reviews) &&
          hotel.totalMad <= input.totalMad * 1.4,
      )
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];
    if (better) picked.push({ label: "better_hotel", hotelId: better.id });
  }

  return picked.slice(0, room);
}
