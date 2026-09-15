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
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          aria-label={isFullscreen ? 'Exit fullscreen map' : 'Fullscreen map'}
          onClick={(e) => {
            e.preventDefault();
            onToggle();
          }}
          // Stays white in both themes to match Leaflet's native zoom controls, which
          // sit on the light OSM basemap. (A `dark:` variant would be inert anyway —
          // Tailwind's zero-specificity `:where(.dark,…)` loses to leaflet.css `.leaflet-bar a`.)
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
