import L from 'leaflet';

export const VIETNAM_BOUNDS: L.LatLngBoundsExpression = [
  [7.5, 101.0],
  [24.0, 110.5],
];
export const VIETNAM_CENTER: [number, number] = [14.5, 107.5];
export const VIETNAM_MIN_ZOOM = 5;

const shipperSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">
    <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.06 27.94 0 18 0z" fill="#2563eb" stroke="#fff" stroke-width="2"/>
    <circle cx="18" cy="17" r="9" fill="#fff"/>
    <path d="M11 20h3v-4h5l2 4h3v-6h-2l-3-4h-4v6h-4v4z" fill="#2563eb"/>
  </svg>`;

const deliverySvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">
    <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.06 27.94 0 18 0z" fill="#dc2626" stroke="#fff" stroke-width="2"/>
    <circle cx="18" cy="17" r="9" fill="#fff"/>
    <path d="M14 12v10h8v-7h-3v-3h-5zm2 2h1v1h-1v-1zm0 3h1v1h-1v-1zm3 0h1v1h-1v-1z" fill="#dc2626"/>
  </svg>`;

export const shipperMapIcon = new L.DivIcon({
  html: shipperSvg,
  className: '',
  iconSize: [36, 46],
  iconAnchor: [18, 46],
  popupAnchor: [0, -46],
});

export const deliveryMapIcon = new L.DivIcon({
  html: deliverySvg,
  className: '',
  iconSize: [36, 46],
  iconAnchor: [18, 46],
  popupAnchor: [0, -46],
});

const addressPinSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">
    <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.06 27.94 0 18 0z" fill="#16a34a" stroke="#fff" stroke-width="2"/>
    <circle cx="18" cy="17" r="9" fill="#fff"/>
    <circle cx="18" cy="17" r="3.5" fill="#16a34a"/>
    <line x1="18" y1="10" x2="18" y2="13" stroke="#16a34a" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="18" y1="21" x2="18" y2="24" stroke="#16a34a" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="11" y1="17" x2="14" y2="17" stroke="#16a34a" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="22" y1="17" x2="25" y2="17" stroke="#16a34a" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`;

export const addressPinIcon = new L.DivIcon({
  html: addressPinSvg,
  className: '',
  iconSize: [36, 46],
  iconAnchor: [18, 46],
  popupAnchor: [0, -46],
});
