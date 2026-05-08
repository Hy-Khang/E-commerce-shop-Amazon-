export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SortParams {
  sort: string;
  order: 'asc' | 'desc';
}
