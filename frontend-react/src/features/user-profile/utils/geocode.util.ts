export interface GeocodeResult {
  lat: number;
  lng: number;
}

/**
 * Single Nominatim (OpenStreetMap) free-text lookup, scoped to Vietnam.
 * Throws on a network / HTTP error; returns null when the query has no match.
 */
async function nominatimSearch(query: string): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '1',
    countrycodes: 'vn',
    'accept-language': 'vi',
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
  if (!res.ok) throw new Error(`Nominatim responded ${res.status}`);
  const data = await res.json();
  if (Array.isArray(data) && data.length > 0) {
    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }
  return null;
}

/**
 * Build progressively broader Nominatim queries from an address line + the
 * city string. Post-2025 that string is "ward, province" (2-tier); the split
 * is comma-based so a legacy 3-part "ward, district, province" value from an
 * older saved address still degrades gracefully.
 *
 * Nominatim rarely has house-number data for Vietnamese streets, and an
 * over-specified query (house number + full new administrative names) often
 * returns `[]`. So we try the most specific form first, then drop the house
 * number, then narrow toward the province — the first candidate that matches
 * wins (duplicate candidates are de-duplicated below).
 */
export function buildGeocodeCandidates(addressLine: string, city: string): string[] {
  const line = (addressLine ?? '').trim();
  const cityStr = (city ?? '').trim();
  const cityParts = cityStr
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Strip a leading house number, e.g. "70 Lê Hồng Phong" → "Lê Hồng Phong",
  // "12A/3 Nguyễn Huệ" → "Nguyễn Huệ".
  const street = line.replace(/^\s*\d+[a-zA-Z]?([/\-]\d+[a-zA-Z]?)*\s*,?\s*/, '').trim();
  const lastTwoAreas = cityParts.slice(-2).join(', '); // ward+province (or district+province for legacy)
  const province = cityParts[cityParts.length - 1] ?? '';

  const candidates = [
    line && cityStr ? `${line}, ${cityStr}` : line || cityStr, // full, as-is
    street && cityStr ? `${street}, ${cityStr}` : '', // no house number
    street && lastTwoAreas ? `${street}, ${lastTwoAreas}` : '', // street + narrowed area
    cityStr, // full city
    lastTwoAreas, // narrowed area
    province, // province only
  ];

  // De-duplicate while preserving order; drop empties.
  return [...new Set(candidates.map((c) => c.trim()).filter(Boolean))];
}

/**
 * Geocode an address by trying the candidate queries from most to least
 * specific. Returns the first match, or null when every candidate is empty.
 * A network / HTTP failure propagates to the caller (so it can surface an
 * error, distinct from a "not found").
 */
export async function geocodeAddress(
  addressLine: string,
  city: string,
): Promise<GeocodeResult | null> {
  for (const query of buildGeocodeCandidates(addressLine, city)) {
    const hit = await nominatimSearch(query);
    if (hit) return hit;
  }
  return null;
}
