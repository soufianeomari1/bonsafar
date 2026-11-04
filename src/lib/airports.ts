/** Static airport positions for the stylised map. The arc uses these, never a tile server. */

export type AirportPoint = { iata: string; city: string; lat: number; lng: number };

export const AIRPORTS: Record<string, AirportPoint> = {
  CMN: { iata: "CMN", city: "Casablanca", lat: 33.37, lng: -7.59 },
  RAK: { iata: "RAK", city: "Marrakech", lat: 31.61, lng: -8.04 },
  RBA: { iata: "RBA", city: "Rabat", lat: 34.05, lng: -6.75 },
  TNG: { iata: "TNG", city: "Tangier", lat: 35.73, lng: -5.92 },
  FEZ: { iata: "FEZ", city: "Fes", lat: 33.93, lng: -4.98 },
  AGA: { iata: "AGA", city: "Agadir", lat: 30.33, lng: -9.41 },
  OUD: { iata: "OUD", city: "Oujda", lat: 34.79, lng: -1.92 },
  IST: { iata: "IST", city: "Istanbul", lat: 41.28, lng: 28.75 },
  SAW: { iata: "SAW", city: "Istanbul", lat: 40.9, lng: 29.31 },
  ESB: { iata: "ESB", city: "Ankara", lat: 40.13, lng: 32.99 },
  AYT: { iata: "AYT", city: "Antalya", lat: 36.9, lng: 30.8 },
  CDG: { iata: "CDG", city: "Paris", lat: 49.01, lng: 2.55 },
  ORY: { iata: "ORY", city: "Paris", lat: 48.72, lng: 2.38 },
  BVA: { iata: "BVA", city: "Paris", lat: 49.45, lng: 2.11 },
  MAD: { iata: "MAD", city: "Madrid", lat: 40.47, lng: -3.56 },
  BCN: { iata: "BCN", city: "Barcelona", lat: 41.3, lng: 2.08 },
  FCO: { iata: "FCO", city: "Rome", lat: 41.8, lng: 12.25 },
  AMS: { iata: "AMS", city: "Amsterdam", lat: 52.31, lng: 4.76 },
  LHR: { iata: "LHR", city: "London", lat: 51.47, lng: -0.45 },
  LIS: { iata: "LIS", city: "Lisbon", lat: 38.77, lng: -9.13 },
  BRU: { iata: "BRU", city: "Brussels", lat: 50.9, lng: 4.48 },
  FRA: { iata: "FRA", city: "Frankfurt", lat: 50.04, lng: 8.56 },
  CAI: { iata: "CAI", city: "Cairo", lat: 30.11, lng: 31.4 },
  TUN: { iata: "TUN", city: "Tunis", lat: 36.85, lng: 10.23 },
  ALG: { iata: "ALG", city: "Algiers", lat: 36.69, lng: 3.22 },
  DXB: { iata: "DXB", city: "Dubai", lat: 25.25, lng: 55.36 },
  DOH: { iata: "DOH", city: "Doha", lat: 25.27, lng: 51.61 },
};

const BOX = { minLng: -16, maxLng: 58, minLat: 18, maxLat: 56 };

export type MapPoint = { x: number; y: number; city: string; known: boolean };

/** Projects an IATA code into a map viewBox. Unknown codes sit on a neutral midpoint. */
export function projectAirport(iata: string, width: number, height: number, pad = 36): MapPoint {
  const known = AIRPORTS[iata.toUpperCase()];
  const lat = known?.lat ?? 36;
  const lng = known?.lng ?? 8;
  const x = pad + ((lng - BOX.minLng) / (BOX.maxLng - BOX.minLng)) * (width - pad * 2);
  const y = pad + ((BOX.maxLat - lat) / (BOX.maxLat - BOX.minLat)) * (height - pad * 2);
  return {
    x: clamp(x, pad, width - pad),
    y: clamp(y, pad, height - pad),
    city: known?.city ?? iata,
    known: !!known,
  };
}

export function arcPath(from: MapPoint, to: MapPoint): string {
  const cx = (from.x + to.x) / 2;
  const cy = Math.min(from.y, to.y) - 78;
  return `M${from.x.toFixed(1)},${from.y.toFixed(1)} Q${cx.toFixed(1)},${Math.max(12, cy).toFixed(1)} ${to.x.toFixed(1)},${to.y.toFixed(1)}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function airportCity(iata: string): string | null {
  return AIRPORTS[iata.toUpperCase()]?.city ?? null;
}
