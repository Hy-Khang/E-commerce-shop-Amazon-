export interface IAddressResponse {
  id: number;
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  is_default: boolean;
}

export interface IUserProfileResponse {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  is_active: boolean;
  created_at: Date;
}
