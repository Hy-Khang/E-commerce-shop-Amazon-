import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import '@/common/components/map/leaflet-setup';
import L from 'leaflet';
import { shipperMapIcon, deliveryMapIcon, VIETNAM_BOUNDS, VIETNAM_MIN_ZOOM } from '@/common/components/map/map-icons';
import { VietnamMask } from '@/common/components/map/VietnamMask';
import type { ShipperLocation, DeliveryLocation } from '../types/order-tracking.types';

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (points.length === 0 || fitted.current) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
      fitted.current = true;
      return;
    }
    const bounds = L.latLngBounds(points.map(([lat, lng]) => L.latLng(lat, lng)));
    map.fitBounds(bounds, { padding: [60, 60] });
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
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-blue-600" />
          Shipper
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-red-600" />
          Delivery Address
        </span>
      </div>
      <div className="h-[350px] w-full overflow-hidden rounded-lg ring-1 ring-slate-200">
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom
          minZoom={VIETNAM_MIN_ZOOM}
          maxBounds={VIETNAM_BOUNDS}
          maxBoundsViscosity={1.0}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <VietnamMask />
          <FitBounds points={points} />

          {shipperLocation && (
            <Marker
              position={[shipperLocation.latitude, shipperLocation.longitude]}
              icon={shipperMapIcon}
            >
              <Popup>
                <strong>Shipper Location</strong>
                <br />
                <span className="text-xs text-slate-500">
                  Updated: {new Date(shipperLocation.createdAt).toLocaleTimeString()}
                </span>
              </Popup>
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
    </div>
  );
}
