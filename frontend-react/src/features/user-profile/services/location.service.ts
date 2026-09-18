import type { LocationItem } from '../types/user-profile.types';

// Vietnam Provinces Open API v2 — updated for the July 2025 provincial merger.
// The hierarchy is now 2-tier: Province/City → Ward/Commune (no district level).
// v1 (the legacy /api endpoints) still serves the OUTDATED pre-merger 63-province
// data (e.g. Hà Giang, Bắc Kạn), so we deliberately pin v2 here.
const BASE_URL = 'https://provinces.open-api.vn/api/v2';

interface ProvinceDetailResponse {
  code: number;
  name: string;
  wards: LocationItem[];
}

export const locationService = {
  async getProvinces(): Promise<LocationItem[]> {
    const res = await fetch(`${BASE_URL}/p/`);
    if (!res.ok) throw new Error('Failed to fetch provinces');
    return res.json();
  },

  // Wards now belong directly to a province (depth=2 returns the province with
  // its `wards` array; there is no intermediate district).
  async getWards(provinceCode: number): Promise<LocationItem[]> {
    const res = await fetch(`${BASE_URL}/p/${provinceCode}?depth=2`);
    if (!res.ok) throw new Error('Failed to fetch wards');
    const data: ProvinceDetailResponse = await res.json();
    return data.wards ?? [];
  },
};
