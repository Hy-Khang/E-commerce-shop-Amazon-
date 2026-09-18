import { useState, useCallback, useRef, useEffect } from 'react';
import { MapContainer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/common/components/map/leaflet-setup';
import { addressPinIcon, VIETNAM_BOUNDS, VIETNAM_MIN_ZOOM } from '@/common/components/map/map-icons';
import { BaseTileLayer } from '@/common/components/map/BaseTileLayer';
import { MapFullscreenControl } from '@/common/components/map/MapFullscreenControl';
import { useMapFullscreen } from '@/common/components/map/useMapFullscreen';
import { Button } from '@/common/components/ui/Button';
import { showWarningToast, showErrorToast } from '@/common/components/feedback/toast';
import { geocodeAddress } from '../utils/geocode.util';

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
  addressLine?: string;
  city?: string;
  onChange: (lat: number, lng: number) => void;
  externalFlyTo?: [number, number] | null;
}

export function AddressMapPicker({ latitude, longitude, addressLine, city, onChange, externalFlyTo }: Props) {
  const { t } = useTranslation('userProfile');
  const { isFullscreen, toggle } = useMapFullscreen();
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

  const hasAddress = Boolean(addressLine?.trim() || city?.trim());

  async function handleGeocode() {
    if (!hasAddress) return;
    setSearching(true);
    try {
      const hit = await geocodeAddress(addressLine ?? '', city ?? '');
      if (hit) {
        onChange(hit.lat, hit.lng);
        setFlyTarget([hit.lat, hit.lng]);
      } else {
        // Request succeeded but no location matched — tell the user instead of
        // silently doing nothing (they can still click the map to pin manually).
        showWarningToast(t('mapPicker.notFound'));
      }
    } catch (err) {
      // Network / service error — surface it rather than swallowing.
      showErrorToast(err, t('mapPicker.geocodeError'));
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-[9999] flex flex-col gap-3 bg-surface p-4' : 'space-y-2'}>
      <div className="flex items-center justify-between shrink-0">
        <label className="text-sm font-medium text-text-primary">
          <MapPin className="mr-1 inline-block h-3.5 w-3.5" />
          {t('mapPicker.label')}
        </label>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleGeocode}
          disabled={!hasAddress || searching}
        >
          {searching ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Search className="mr-1.5 h-3.5 w-3.5" />
          )}
          {t('mapPicker.findOnMap')}
        </Button>
      </div>

      <div className={`relative z-0 w-full overflow-hidden rounded-lg ring-1 ring-border-default ${isFullscreen ? 'flex-1' : 'h-[220px]'}`}>
        <MapContainer center={center} zoom={position ? 16 : 12} scrollWheelZoom zoomAnimation={false} minZoom={VIETNAM_MIN_ZOOM} maxBounds={VIETNAM_BOUNDS} maxBoundsViscosity={1.0} className="h-full w-full">
          <BaseTileLayer />
          <MapFullscreenControl isFullscreen={isFullscreen} onToggle={toggle} />
          <ClickHandler onSelect={handleSelect} />
          <FlyTo position={flyTarget} />
          {position && <Marker position={position} icon={addressPinIcon} />}
        </MapContainer>
      </div>

      <p className="text-xs text-text-muted">
        {position
          ? t('mapPicker.selected', {
              lat: position[0].toFixed(6),
              lng: position[1].toFixed(6),
            })
          : t('mapPicker.hint')}
      </p>
    </div>
  );
}
