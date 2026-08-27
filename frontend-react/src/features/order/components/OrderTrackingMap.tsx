import { useEffect, useRef } from 'react';
import { MapContainer, Marker, Popup, useMap } from 'react-leaflet';
import '@/common/components/map/leaflet-setup';
import L from 'leaflet';
import { shipperMapIcon, deliveryMapIcon, VIETNAM_BOUNDS, VIETNAM_MIN_ZOOM } from '@/common/components/map/map-icons';
import { BaseTileLayer } from '@/common/components/map/BaseTileLayer';
import { VietnamBorderHighlight } from '@/common/components/map/vietnam-land-border';
import { MapFullscreenControl } from '@/common/components/map/MapFullscreenControl';
import { useMapFullscreen } from '@/common/components/map/useMapFullscreen';
import { RouteLine } from '@/common/components/map/RouteLine';
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
  const { isFullscreen, toggle } = useMapFullscreen();

  const points: [number, number][] = [];
  if (shipperLocation) points.push([shipperLocation.latitude, shipperLocation.longitude]);
  if (deliveryLocation) points.push([deliveryLocation.latitude, deliveryLocation.longitude]);

  const center: [number, number] = points.length > 0
    ? points[0]
    : [10.762622, 106.660172];

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-[9999] flex flex-col gap-3 bg-surface p-4' : 'space-y-3'}>
      <div className="flex items-center gap-4 text-xs text-text-secondary">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-blue-600" />
          Shipper
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-red-600" />
          Delivery Address
        </span>
        {shipperLocation && deliveryLocation && (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-0.5 border-t-2 border-dashed border-blue-500 bg-transparent" style={{ width: 12 }} />
            Route
          </span>
        )}
      </div>
      <div className={`w-full overflow-hidden rounded-lg ring-1 ring-border-default ${isFullscreen ? 'flex-1' : 'h-[350px]'}`}>
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom
          minZoom={VIETNAM_MIN_ZOOM}
          maxBounds={VIETNAM_BOUNDS}
          maxBoundsViscosity={1.0}
          className="h-full w-full"
        >
          <BaseTileLayer />
          <VietnamBorderHighlight />
          <MapFullscreenControl isFullscreen={isFullscreen} onToggle={toggle} />
          <FitBounds points={points} />

          {shipperLocation && deliveryLocation && (
            <RouteLine
              from={[shipperLocation.latitude, shipperLocation.longitude]}
              to={[deliveryLocation.latitude, deliveryLocation.longitude]}
            />
          )}

          {shipperLocation && (
            <Marker
              position={[shipperLocation.latitude, shipperLocation.longitude]}
              icon={shipperMapIcon}
            >
              <Popup>
                <strong>Shipper Location</strong>
                <br />
                <span className="text-xs text-neutral-500">
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
