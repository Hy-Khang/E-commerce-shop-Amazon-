import { useState, useCallback, useRef, useEffect } from 'react';
import { MapContainer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { MapPin, Search, Loader2 } from 'lucide-react';
import '@/common/components/map/leaflet-setup';
import { addressPinIcon, VIETNAM_BOUNDS, VIETNAM_MIN_ZOOM } from '@/common/components/map/map-icons';
import { BaseTileLayer } from '@/common/components/map/BaseTileLayer';
import { Button } from '@/common/components/ui/Button';

function ClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyTo({ position }: { position: [number, number] | null }) {
  const map = useMap();
  const lastKey = useRef('');

  useEffect(() => {
    if (!position) return;
    const key = `${position[0].toFixed(6)},${position[1].toFixed(6)}`;
    if (key === lastKey.current) return;
    lastKey.current = key;
    map.flyTo(position, 16, { duration: 1 });
  }, [map, position]);

  return null;
}

interface Props {
  latitude: number | null;
  longitude: number | null;
  addressText?: string;
  onChange: (lat: number, lng: number) => void;
  externalFlyTo?: [number, number] | null;
}

export function AddressMapPicker({ latitude, longitude, addressText, onChange, externalFlyTo }: Props) {
  const [searching, setSearching] = useState(false);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  const prevExternal = useRef<string>('');
  useEffect(() => {
    if (externalFlyTo) {
      const key = `${externalFlyTo[0]},${externalFlyTo[1]}`;
      if (key !== prevExternal.current) {
        prevExternal.current = key;
        setFlyTarget(externalFlyTo);
      }
    }
  }, [externalFlyTo]);

  const position: [number, number] | null =
    latitude != null && longitude != null ? [latitude, longitude] : null;

  const center: [number, number] = position ?? [10.762622, 106.660172];

  const handleSelect = useCallback(
    (lat: number, lng: number) => {
      onChange(lat, lng);
    },
    [onChange],
  );

  async function handleGeocode() {
    if (!addressText?.trim()) return;
    setSearching(true);
    try {
      const query = encodeURIComponent(addressText.trim());
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      );
      const data = await res.json();
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        onChange(lat, lng);
        setFlyTarget([lat, lng]);
      }
    } catch {
      // Geocoding failed silently — user can still click the map
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-text-primary">
          <MapPin className="mr-1 inline-block h-3.5 w-3.5" />
          Pin on Map
        </label>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleGeocode}
          disabled={!addressText?.trim() || searching}
        >
          {searching ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Search className="mr-1.5 h-3.5 w-3.5" />
          )}
          Find on map
        </Button>
      </div>

      <div className="relative z-0 h-[220px] w-full overflow-hidden rounded-lg ring-1 ring-border-default">
        <MapContainer center={center} zoom={position ? 16 : 12} scrollWheelZoom minZoom={VIETNAM_MIN_ZOOM} maxBounds={VIETNAM_BOUNDS} maxBoundsViscosity={1.0} className="h-full w-full">
          <BaseTileLayer />
          <ClickHandler onSelect={handleSelect} />
          <FlyTo position={flyTarget} />
          {position && <Marker position={position} icon={addressPinIcon} />}
        </MapContainer>
      </div>

      <p className="text-xs text-text-muted">
        {position
          ? `Selected: ${position[0].toFixed(6)}, ${position[1].toFixed(6)}`
          : 'Click the map or use "Find on map" to set delivery coordinates'}
      </p>
    </div>
  );
}
