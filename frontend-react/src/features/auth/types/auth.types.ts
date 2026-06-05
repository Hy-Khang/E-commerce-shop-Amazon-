import { z } from 'zod';

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  role_id: number;
  permissions: string[];
}

export interface AuthMeResponse {
  id: number;
  email: string;
  full_name: string;
  role: string;
  role_id: number;
  permissions: string[];
  is_active: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginRequest = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    full_name: z.string().min(1, 'Full name is required').max(100),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
}
