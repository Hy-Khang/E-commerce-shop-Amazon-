import { useQuery } from '@tanstack/react-query';
import { locationService } from '../services/location.service';

export const locationKeys = {
  provinces: ['locations', 'provinces'] as const,
  wards: (provinceCode: number) => ['locations', 'wards', provinceCode] as const,
};

export function useProvinces() {
  return useQuery({
    queryKey: locationKeys.provinces,
    queryFn: locationService.getProvinces,
    staleTime: Infinity,
  });
}

// Post-2025 hierarchy: wards are fetched directly for a province (no district).
export function useWards(provinceCode: number | null) {
  return useQuery({
    queryKey: locationKeys.wards(provinceCode!),
    queryFn: () => locationService.getWards(provinceCode!),
    enabled: provinceCode != null,
    staleTime: Infinity,
  });
}
