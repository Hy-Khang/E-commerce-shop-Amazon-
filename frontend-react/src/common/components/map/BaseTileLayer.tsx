import { useEffect } from 'react';
import { TileLayer, useMap } from 'react-leaflet';
import { MaptilerLayer, MapStyle, Language } from '@maptiler/leaflet-maptilersdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';

// NOT a secret: Vite inlines every VITE_* var into the client bundle. Empty/undefined
// → OSM fallback (see .env.example). Restrict the key by domain in the MapTiler dashboard.
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;

// MapTiler vector basemap embedded as a Leaflet layer. Streets style + Vietnamese
// labels (prefers vi where the style/data has it, otherwise the style's fallback).
// react-leaflet has no factory for this plugin, so add it imperatively via useMap.
function MapTilerBase({ apiKey }: { apiKey: string }) {
  const map = useMap();

  useEffect(() => {
    const layer = new MaptilerLayer({
      apiKey,
      style: MapStyle.STREETS,
      language: Language.VIETNAMESE,
    });
    layer.addTo(map);
    return () => {
      layer.remove();
    };
  }, [map, apiKey]);

  return null;
}

// Single source of truth for the basemap: MapTiler when a key is configured,
// otherwise the OSM raster tiles. Consumers just render <BaseTileLayer />.
export function BaseTileLayer() {
  if (MAPTILER_KEY) {
    return <MapTilerBase apiKey={MAPTILER_KEY} />;
  }
  return (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
  );
}
