import {
  SHIPPING_BASE_FEE,
  SHIPPING_BASE_KM,
  SHIPPING_PER_KM,
  SHIPPING_MIN_FEE,
  SHIPPING_MAX_FEE,
  SHIPPING_ROUNDING,
} from '../types/order.types';

export interface IGeoPoint {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_KM = 6371;

const toRadians = (deg: number): number => (deg * Math.PI) / 180;

/**
 * Great-circle distance (km) between two lat/lng points via the Haversine
 * formula. Coordinate-only → immune to administrative name/id changes (e.g. the
 * 2025 province merger). Returns a non-negative number.
 */
export function haversineKm(a: IGeoPoint, b: IGeoPoint): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Tiered distance fee (₫, integer): a flat base for the first `SHIPPING_BASE_KM`
 * km, then `SHIPPING_PER_KM` per extra km, rounded to the nearest
 * `SHIPPING_ROUNDING` and clamped to `[SHIPPING_MIN_FEE, SHIPPING_MAX_FEE]`.
 */
export function calcDistanceShippingFee(distanceKm: number): number {
  const extraKm = Math.max(0, distanceKm - SHIPPING_BASE_KM);
  const raw = SHIPPING_BASE_FEE + extraKm * SHIPPING_PER_KM;
  const rounded = Math.round(raw / SHIPPING_ROUNDING) * SHIPPING_ROUNDING;
  return Math.min(SHIPPING_MAX_FEE, Math.max(SHIPPING_MIN_FEE, rounded));
}

/**
 * Both coordinates present and finite? Guards against NULL DB columns and the
 * (0, 0) placeholder that a never-picked location leaves behind.
 */
export function isValidGeoPoint(
  point: { latitude?: number | null; longitude?: number | null } | null,
): point is IGeoPoint {
  if (!point) return false;
  const { latitude, longitude } = point;
  return (
    latitude != null &&
    longitude != null &&
    Number.isFinite(Number(latitude)) &&
    Number.isFinite(Number(longitude)) &&
    !(Number(latitude) === 0 && Number(longitude) === 0)
  );
}
