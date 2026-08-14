import { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { MapPin, Search, Loader2 } from 'lucide-react';
import '@/common/components/map/leaflet-setup';
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
  if (position) {
    map.flyTo(position, 16, { duration: 1 });
  }
  return null;
}

interface Props {
  latitude: number | null;
  longitude: number | null;
  addressText?: string;
  onChange: (lat: number, lng: number) => void;
}

export function AddressMapPicker({ latitude, longitude, addressText, onChange }: Props) {
  const [searching, setSearching] = useState(false);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

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

      <div className="h-[220px] w-full overflow-hidden rounded-lg ring-1 ring-border-default">
        <MapContainer center={center} zoom={position ? 16 : 12} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onSelect={handleSelect} />
          <FlyTo position={flyTarget} />
          {position && <Marker position={position} />}
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
