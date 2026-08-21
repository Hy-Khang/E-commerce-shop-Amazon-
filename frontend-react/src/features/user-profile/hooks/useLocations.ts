import { useQuery } from '@tanstack/react-query';
import { locationService } from '../services/location.service';

export const locationKeys = {
  provinces: ['locations', 'provinces'] as const,
  districts: (provinceCode: number) => ['locations', 'districts', provinceCode] as const,
  wards: (districtCode: number) => ['locations', 'wards', districtCode] as const,
};

export function useProvinces() {
  return useQuery({
    queryKey: locationKeys.provinces,
    queryFn: locationService.getProvinces,
    staleTime: Infinity,
  });
}

export function useDistricts(provinceCode: number | null) {
  return useQuery({
    queryKey: locationKeys.districts(provinceCode!),
    queryFn: () => locationService.getDistricts(provinceCode!),
    enabled: provinceCode != null,
    staleTime: Infinity,
  });
}

export function useWards(districtCode: number | null) {
  return useQuery({
    queryKey: locationKeys.wards(districtCode!),
    queryFn: () => locationService.getWards(districtCode!),
    enabled: districtCode != null,
    staleTime: Infinity,
  });
}
