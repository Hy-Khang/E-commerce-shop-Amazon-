import { useEffect, useState, useRef } from 'react';
import { Polyline, Tooltip } from 'react-leaflet';
import { VIETNAM_BORDER } from './VietnamMask';

interface RouteLineProps {
  from: [number, number];
  to: [number, number];
}

interface RouteInfo {
  distance: number;
  duration: number;
}

// NOT a secret: Vite inlines every VITE_* var into the client bundle.
// Empty → app falls back to OSRM (tier 2). See .env.example.
const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}min` : `${hours}h`;
}

// Name-based check — robust for browser DOMException aborts and any Error-like throw.
function isAbortError(error: unknown): boolean {
  return (error as { name?: string } | null)?.name === 'AbortError';
}

function isInsideVietnam(lat: number, lng: number): boolean {
  let inside = false;
  for (let i = 0, j = VIETNAM_BORDER.length - 1; i < VIETNAM_BORDER.length; j = i++) {
    const [xi, yi] = VIETNAM_BORDER[i];
    const [xj, yj] = VIETNAM_BORDER[j];
    const intersect = yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function isRouteInsideVietnam(coords: [number, number][]): boolean {
  const step = Math.max(1, Math.floor(coords.length / 50));
  for (let i = 0; i < coords.length; i += step) {
    if (!isInsideVietnam(coords[i][0], coords[i][1])) return false;
  }
  return true;
}

// Tier 1 — OpenRouteService. avoid_borders keeps the route inside VN natively.
async function fetchOrsRoute(
  from: [number, number],
  to: [number, number],
  signal: AbortSignal,
): Promise<{ coords: [number, number][]; distance: number; duration: number } | null> {
  const res = await fetch(
    'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
    {
      method: 'POST',
      headers: {
        // ORS expects the raw key in Authorization (NOT `Bearer <key>`).
        Authorization: ORS_API_KEY,
        'Content-Type': 'application/json',
      },
      // ORS takes [lng, lat] pairs.
      body: JSON.stringify({
        coordinates: [
          [from[1], from[0]],
          [to[1], to[0]],
        ],
        options: { avoid_borders: 'all' },
      }),
      signal,
    },
  );
  // fetch() does NOT reject on 403/429 — throw so the caller falls back to OSRM.
  if (!res.ok) throw new Error(`ORS ${res.status}`);

  const data = await res.json();
  const feature = data.features?.[0];
  // 200 but malformed/empty body → return null to fall through to OSRM.
  if (!feature?.geometry?.coordinates) return null;

  // GeoJSON [lng, lat] → Leaflet [lat, lng].
  const coords: [number, number][] = feature.geometry.coordinates.map(
    ([lng, lat]: [number, number]) => [lat, lng],
  );
  const summary = feature.properties?.summary ?? {};
  return { coords, distance: summary.distance ?? 0, duration: summary.duration ?? 0 };
}

// Tier 2 — OSRM demo server. Global graph, so its route is validated against VN.
async function fetchOsrmRoute(
  from: [number, number],
  to: [number, number],
  signal: AbortSignal,
): Promise<{ coords: [number, number][]; distance: number; duration: number } | null> {
  const coordsParam = `${from[1]},${from[0]};${to[1]},${to[0]}`;
  const res = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${coordsParam}?overview=full&geometries=geojson`,
    { signal },
  );
  if (!res.ok) throw new Error(`OSRM ${res.status}`);

  const data = await res.json();
  if (data.code === 'Ok' && data.routes?.[0]) {
    const route = data.routes[0];
    // GeoJSON [lng, lat] → Leaflet [lat, lng].
    const coords: [number, number][] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng],
    );
    return { coords, distance: route.distance, duration: route.duration };
  }
  return null;
}

export function RouteLine({ from, to }: RouteLineProps) {
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  // Only holds keys of SUCCESSFUL routes — tier-3 straight line never sets it, so a
  // transient failure retries once the shipper moves (coords change).
  const lastRoutedKey = useRef('');

  useEffect(() => {
    const key = `${from[0]},${from[1]};${to[0]},${to[1]}`;
    if (key === lastRoutedKey.current) return;

    const controller = new AbortController();

    (async () => {
      // Tier 1 — ORS
      if (ORS_API_KEY) {
        try {
          const ors = await fetchOrsRoute(from, to, controller.signal);
          if (ors) {
            lastRoutedKey.current = key;
            setRouteCoords(ors.coords);
            setRouteInfo({ distance: ors.distance, duration: ors.duration });
            return;
          }
        } catch (e) {
          if (isAbortError(e)) return;
          // else → fall through to OSRM
        }
      }

      // Tier 2 — OSRM (validated inside VN)
      try {
        const osrm = await fetchOsrmRoute(from, to, controller.signal);
        if (osrm && isRouteInsideVietnam(osrm.coords)) {
          lastRoutedKey.current = key;
          setRouteCoords(osrm.coords);
          setRouteInfo({ distance: osrm.distance, duration: osrm.duration });
          return;
        }
      } catch (e) {
        if (isAbortError(e)) return;
        // else → fall through to straight line
      }

      // Tier 3 — straight line. Deliberately does NOT set lastRoutedKey → retry later.
      setRouteCoords([from, to]);
      setRouteInfo(null);
    })();

    return () => controller.abort();
  }, [from[0], from[1], to[0], to[1]]);

  if (routeCoords.length === 0) return null;

  return (
    <Polyline
      positions={routeCoords}
      pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.7, dashArray: '10, 6' }}
    >
      {routeInfo && (
        <Tooltip sticky>
          {formatDistance(routeInfo.distance)} • {formatDuration(routeInfo.duration)}
        </Tooltip>
      )}
    </Polyline>
  );
}
