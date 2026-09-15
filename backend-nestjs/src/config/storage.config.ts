import { registerAs } from '@nestjs/config';

/**
 * Supabase Storage config. The service-role key is **backend-only** (it bypasses
 * RLS) — never expose it to the frontend / Vite env. The bucket is public-read,
 * so image URLs work without a signed request; writes/deletes go through this key.
 */
export default registerAs('storage', () => ({
  supabaseUrl: process.env.SUPABASE_URL || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  bucket: process.env.SUPABASE_BUCKET || 'product-images',
}));
