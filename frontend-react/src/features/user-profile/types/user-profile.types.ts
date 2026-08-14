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
  latitude: number | null;
  longitude: number | null;
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
  latitude?: number;
  longitude?: number;
}

export interface UpdateAddressRequest {
  full_name?: string;
  phone?: string;
  address_line?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
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
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type AddressFormData = z.infer<typeof addressSchema>;
