import { Polyline } from 'react-leaflet';
import { VIETNAM_LAND_BORDER } from './vietnam-land-border.data';

export function VietnamBorderHighlight() {
  return (
    <Polyline
      positions={VIETNAM_LAND_BORDER}
      pathOptions={{ color: '#000000', weight: 3, opacity: 0.95 }}
    />
  );
}
