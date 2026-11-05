/**
 * Keep the direct flight unless it costs more than the flight with a stop by
 * both of these. The dirham cap is per paying traveller (adults + children,
 * not infants): the total gap allowed is 800 DH times that number.
 */
export const DIRECT_MAX_EXTRA_RATIO = 0.2;
export const DIRECT_MAX_EXTRA_MAD = 800;
