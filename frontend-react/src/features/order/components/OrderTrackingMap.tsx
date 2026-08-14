import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import '@/common/components/map/leaflet-setup';
import L from 'leaflet';
import type { ShipperLocation, DeliveryLocation } from '../types/order-tracking.types';

const shipperIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
      fitted.current = true;
      return;
    }
    const bounds = L.latLngBounds(points.map(([lat, lng]) => L.latLng(lat, lng)));
    map.fitBounds(bounds, { padding: [50, 50] });
    fitted.current = true;
  }, [map, points]);

  return null;
}

interface Props {
  shipperLocation: ShipperLocation | null;
  deliveryLocation?: DeliveryLocation | null;
}

export function OrderTrackingMap({ shipperLocation, deliveryLocation }: Props) {
  const points: [number, number][] = [];
  if (shipperLocation) points.push([shipperLocation.latitude, shipperLocation.longitude]);
  if (deliveryLocation) points.push([deliveryLocation.latitude, deliveryLocation.longitude]);

  const center: [number, number] = points.length > 0
    ? points[0]
    : [10.762622, 106.660172];

  return (
    <div className="h-[350px] w-full overflow-hidden rounded-lg ring-1 ring-slate-200">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />

        {shipperLocation && (
          <Marker
            position={[shipperLocation.latitude, shipperLocation.longitude]}
            icon={shipperIcon}
          >
            <Popup>Shipper location</Popup>
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
  );
}
