import { useState } from 'react';
import { MapContainer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { MapPin } from 'lucide-react';
import '@/common/components/map/leaflet-setup';
import { shipperMapIcon, deliveryMapIcon, VIETNAM_BOUNDS, VIETNAM_MIN_ZOOM } from '@/common/components/map/map-icons';
import { BaseTileLayer } from '@/common/components/map/BaseTileLayer';
import { VietnamBorderHighlight } from '@/common/components/map/vietnam-land-border';
import { MapFullscreenControl, useMapFullscreen } from '@/common/components/map/MapFullscreenControl';
import { RouteLine } from '@/common/components/map/RouteLine';
import { Button } from '@/common/components/ui/Button';
import { showErrorToast, showSuccessToast } from '@/common/components/feedback/toast';
import { useUpdateShipperLocation } from '../hooks/useOrderTracking';
import type { ShipperLocation, DeliveryLocation } from '../types/order-tracking.types';

function ClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface Props {
  orderId: number;
  currentLocation?: ShipperLocation | null;
  deliveryLocation?: DeliveryLocation | null;
}

export function ShipperLocationUpdater({ orderId, currentLocation, deliveryLocation }: Props) {
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(
    currentLocation ? [currentLocation.latitude, currentLocation.longitude] : null,
  );
  const updateLocation = useUpdateShipperLocation();
  const { isFullscreen, toggle } = useMapFullscreen();

  // Seed the marker once `currentLocation` arrives (it may load after mount).
  // Adjust state during render (React docs: "storing info from previous
  // renders") instead of an effect.
  const [prevLocation, setPrevLocation] = useState(currentLocation);
  if (currentLocation !== prevLocation) {
    setPrevLocation(currentLocation);
    if (currentLocation && !selectedPosition) {
      setSelectedPosition([currentLocation.latitude, currentLocation.longitude]);
    }
  }

  const center: [number, number] = selectedPosition
    ?? (deliveryLocation ? [deliveryLocation.latitude, deliveryLocation.longitude] : [10.762622, 106.660172]);

  function handleSave() {
    if (!selectedPosition) return;
    updateLocation.mutate(
      { orderId, data: { latitude: selectedPosition[0], longitude: selectedPosition[1] } },
      {
        onSuccess: () => showSuccessToast('Location updated successfully'),
        onError: (error) => showErrorToast(error),
      },
    );
  }

  const hasNewPosition = selectedPosition && (
    !currentLocation ||
    selectedPosition[0] !== currentLocation.latitude ||
    selectedPosition[1] !== currentLocation.longitude
  );

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-[9999] flex flex-col gap-3 bg-white p-4' : 'space-y-3'}>
      <p className="text-xs text-slate-500">Click on the map to set your current location.</p>
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-blue-600" />
          Your Location
        </span>
        {deliveryLocation && (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-red-600" />
            Delivery Address
          </span>
        )}
        {selectedPosition && deliveryLocation && (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-0.5 border-t-2 border-dashed border-blue-500 bg-transparent" style={{ width: 12 }} />
            Route
          </span>
        )}
      </div>
      <div className={`w-full overflow-hidden rounded-lg ring-1 ring-slate-200 ${isFullscreen ? 'flex-1' : 'h-[300px]'}`}>
        <MapContainer center={center} zoom={14} scrollWheelZoom minZoom={VIETNAM_MIN_ZOOM} maxBounds={VIETNAM_BOUNDS} maxBoundsViscosity={1.0} className="h-full w-full">
          <BaseTileLayer />
          <VietnamBorderHighlight />
          <MapFullscreenControl isFullscreen={isFullscreen} onToggle={toggle} />
          <ClickHandler onLocationSelect={(lat, lng) => setSelectedPosition([lat, lng])} />

          {selectedPosition && deliveryLocation && (
            <RouteLine
              from={selectedPosition}
              to={[deliveryLocation.latitude, deliveryLocation.longitude]}
            />
          )}

          {selectedPosition && (
            <Marker position={selectedPosition} icon={shipperMapIcon}>
              <Popup>Your location</Popup>
            </Marker>
          )}

          {deliveryLocation && (
            <Marker
              position={[deliveryLocation.latitude, deliveryLocation.longitude]}
              icon={deliveryMapIcon}
            >
              <Popup>
                <strong>Delivery Address</strong>
                <br />
                {deliveryLocation.label}
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      <Button
        onClick={handleSave}
        disabled={!hasNewPosition}
        loading={updateLocation.isPending}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        <MapPin className="mr-2 h-4 w-4" />
        Update Location
      </Button>
    </div>
  );
}
