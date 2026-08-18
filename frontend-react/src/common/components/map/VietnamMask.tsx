// Rough hand-traced Vietnam boundary (land borders + offshore sea line).
// The gray country mask was removed; this polygon is now used only by RouteLine's
// point-in-polygon check to validate that a routed path stays within Vietnam.
// (The visible land-border highlight uses accurate data in ./vietnam-land-border.)
export const VIETNAM_BORDER: [number, number][] = [
  [23.39, 105.33],
  [23.32, 104.87],
  [23.08, 104.68],
  [22.82, 104.37],
  [22.68, 103.73],
  [22.80, 103.33],
  [22.50, 103.30],
  [22.40, 102.98],
  [22.85, 102.15],
  [22.35, 102.14],
  [21.83, 102.35],
  [21.48, 102.56],
  [21.12, 102.82],
  [20.75, 103.15],
  [20.42, 103.63],
  [20.15, 103.82],
  [19.68, 104.08],
  [19.00, 104.57],
  [18.55, 105.08],
  [18.25, 105.11],
  [17.60, 105.53],
  [17.10, 105.97],
  [16.60, 106.52],
  [16.05, 106.65],
  [15.85, 107.10],
  [15.60, 107.35],
  [15.25, 107.65],
  [14.70, 107.55],
  [14.10, 107.52],
  [13.20, 107.28],
  [12.80, 107.10],
  [12.40, 107.02],
  [12.20, 106.70],
  [11.75, 106.00],
  [11.38, 106.10],
  [11.10, 106.40],
  [10.95, 106.40],
  [10.83, 106.18],
  [10.77, 105.70],
  [10.54, 105.48],
  [10.43, 104.82],
  [10.30, 104.48],
  [10.11, 104.33],
  // --- Ranh giới ngoài khơi: giữ vùng biển Việt Nam (Biển Đông + Vịnh Thái Lan) không bị che ---
  // Vòng ra ngoài khơi từ Hà Tiên, quanh mũi Cà Mau, ngược lên Biển Đông rồi về Vịnh Bắc Bộ.
  [9.60, 103.90], // ngoài khơi Tây Nam Kiên Giang
  [8.60, 103.90], // phía Tây bán đảo Cà Mau
  [8.00, 104.30], // Tây Nam mũi Cà Mau
  [7.80, 105.20], // phía Nam mũi Cà Mau
  [8.10, 106.20], // Đông Nam Cà Mau, ra Biển Đông
  [8.90, 107.20], // ngoài khơi Đông Nam ĐBSCL
  [9.70, 108.10],
  [10.50, 108.90], // ngoài khơi Vũng Tàu / Bình Thuận
  [11.50, 109.70],
  [12.60, 110.10], // ngoài khơi Nha Trang
  [13.80, 110.30],
  [15.00, 110.35], // điểm vươn xa nhất về phía Đông (Biển Đông)
  [16.20, 110.20], // ngoài khơi Đà Nẵng / Quảng Ngãi
  [17.20, 109.20], // vòng trở lại phía Tây, phía Nam đảo Hải Nam
  [18.30, 108.30], // phía Tây Hải Nam (Vịnh Bắc Bộ) — không khoét trúng Hải Nam
  [19.40, 107.90],
  [20.40, 107.75],
  [21.00, 107.90], // Đông Bắc Vịnh Bắc Bộ, tiến về biên giới đất liền
  [21.27, 107.95],
  [21.60, 107.99],
  [21.50, 107.35],
  [21.65, 106.72],
  [22.15, 106.69],
  [22.46, 106.54],
  [22.80, 106.14],
  [22.93, 105.53],
  [23.39, 105.33],
];
