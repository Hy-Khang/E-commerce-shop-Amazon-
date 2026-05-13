import { z } from 'zod';

// --- Response types ---

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: number;
  user_id: number;
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  is_default: boolean;
}

// --- Request types ---

export interface UpdateProfileRequest {
  full_name: string;
  phone?: string;
}

export interface CreateAddressRequest {
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
}

export interface UpdateAddressRequest {
  full_name?: string;
  phone?: string;
  address_line?: string;
  city?: string;
}

// --- Zod schemas (forms) ---

export const updateProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100),
  phone: z.string().max(20).optional().or(z.literal('')),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

export const addressSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100),
  phone: z.string().min(1, 'Phone is required').max(20),
  address_line: z.string().min(1, 'Address is required').max(255),
  city: z.string().min(1, 'City is required').max(100),
});

export type AddressFormData = z.infer<typeof addressSchema>;
