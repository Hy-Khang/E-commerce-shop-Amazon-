import type { LocationItem } from '../types/user-profile.types';

const BASE_URL = 'https://provinces.open-api.vn/api';

interface ProvinceDetailResponse {
  code: number;
  name: string;
  districts: LocationItem[];
}

interface DistrictDetailResponse {
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

  async getDistricts(provinceCode: number): Promise<LocationItem[]> {
    const res = await fetch(`${BASE_URL}/p/${provinceCode}?depth=2`);
    if (!res.ok) throw new Error('Failed to fetch districts');
    const data: ProvinceDetailResponse = await res.json();
    return data.districts;
  },

  async getWards(districtCode: number): Promise<LocationItem[]> {
    const res = await fetch(`${BASE_URL}/d/${districtCode}?depth=2`);
    if (!res.ok) throw new Error('Failed to fetch wards');
    const data: DistrictDetailResponse = await res.json();
    return data.wards;
  },
};
