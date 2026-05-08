import { useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';
import type { PaginationParams } from '@/common/types/common.types';

export function usePagination(defaults?: Partial<PaginationParams>) {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo((): PaginationParams => ({
    page: Number(searchParams.get('page')) || defaults?.page || 1,
    limit: Number(searchParams.get('limit')) || defaults?.limit || 20,
    sort: searchParams.get('sort') || defaults?.sort,
    order: (searchParams.get('order') as 'asc' | 'desc') || defaults?.order,
  }), [searchParams, defaults?.page, defaults?.limit, defaults?.sort, defaults?.order]);

  function setPage(page: number) {
    setSearchParams((prev) => {
      prev.set('page', String(page));
      return prev;
    });
  }

  return { params, setPage, searchParams, setSearchParams };
}
