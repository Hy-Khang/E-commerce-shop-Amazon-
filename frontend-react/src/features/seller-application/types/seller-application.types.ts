export type SellerApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface SellerApplication {
  id: number;
  user_id: number;
  status: SellerApplicationStatus;
  shop_name: string;
  phone: string;
  business_name: string | null;
  tax_id: string | null;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  reject_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface CreateSellerApplicationRequest {
  shop_name: string;
  phone: string;
  business_name?: string;
  tax_id?: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
}

export interface SellerApplicationFilterParams {
  status?: SellerApplicationStatus;
  page?: number;
  limit?: number;
}
