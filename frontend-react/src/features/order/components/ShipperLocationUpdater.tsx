import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { MapPin } from 'lucide-react';
import '@/common/components/map/leaflet-setup';
import L from 'leaflet';
import { Button } from '@/common/components/ui/Button';
import { showErrorToast } from '@/common/components/feedback/toast';
import { useUpdateShipperLocation } from '../hooks/useOrderTracking';
import type { ShipperLocation, DeliveryLocation } from '../types/order-tracking.types';

const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

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

  const center: [number, number] = selectedPosition
    ?? (deliveryLocation ? [deliveryLocation.latitude, deliveryLocation.longitude] : [10.762622, 106.660172]);

  function handleSave() {
    if (!selectedPosition) return;
    updateLocation.mutate(
      { orderId, data: { latitude: selectedPosition[0], longitude: selectedPosition[1] } },
      {
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
    <div className="space-y-3">
      <p className="text-xs text-slate-500">Click on the map to set your current location.</p>
      <div className="h-[300px] w-full overflow-hidden rounded-lg ring-1 ring-slate-200">
        <MapContainer center={center} zoom={14} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onLocationSelect={(lat, lng) => setSelectedPosition([lat, lng])} />

          {selectedPosition && (
            <Marker position={selectedPosition}>
              <Popup>Your location</Popup>
            </Marker>
          )}

          {deliveryLocation && (
            <Marker
              position={[deliveryLocation.latitude, deliveryLocation.longitude]}
              icon={deliveryIcon}
            >
              <Popup>{deliveryLocation.label}</Popup>
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
