import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { Maximize2, Minimize2 } from 'lucide-react';

// In-map control button. Must be rendered as a child of <MapContainer>.
// The fullscreen state hook lives in ./useMapFullscreen.
export function MapFullscreenControl({ isFullscreen, onToggle }: { isFullscreen: boolean; onToggle: () => void }) {
  const map = useMap();

  // Container size changes when toggling fullscreen — Leaflet must recompute its
  // size or tiles render offset/blank.
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 120);
    return () => clearTimeout(t);
  }, [isFullscreen, map]);

  return (
    <div className="leaflet-top leaflet-right">
      <div className="leaflet-control leaflet-bar">
        <a
          href="#"
          role="button"
          title={isFullscreen ? 'Thu nhỏ' : 'Phóng to'}
          aria-label={isFullscreen ? 'Thu nhỏ bản đồ' : 'Phóng to bản đồ'}
          onClick={(e) => {
            e.preventDefault();
            onToggle();
          }}
          className="bg-white text-slate-700 hover:bg-slate-50"
          // Inline layout beats Leaflet's `.leaflet-bar a` block/26px rules without !important.
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30 }}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </a>
      </div>
    </div>
  );
}
