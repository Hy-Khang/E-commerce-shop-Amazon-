export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}


export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ValidationDetail[];
  };
}

export interface ValidationDetail {
  field: string;
  message: string;
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: ValidationDetail[];

  constructor(code: string, message: string, status: number, details?: ValidationDetail[]) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
