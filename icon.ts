import L from 'leaflet';

function createSvgIcon(color: string, label: string): L.DivIcon {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26s16-14 16-26C32 7.16 24.84 0 16 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <circle cx="16" cy="16" r="7" fill="#fff"/>
      <text x="16" y="20" text-anchor="middle" font-size="12" font-weight="bold" fill="${color}">${label}</text>
    </svg>`;

    return new L.DivIcon({
        html: svg,
        className: '',
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -42],
    });
}

export const shipperIcon = createSvgIcon('#2563eb', '🚚'.length ? '' : '');
export const deliveryIcon = createSvgIcon('#dc2626', '');

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
