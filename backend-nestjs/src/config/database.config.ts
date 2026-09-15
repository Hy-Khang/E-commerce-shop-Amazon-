import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'postgres',
  // Supabase requires SSL. Defaults to true (empty/unset → SSL on).
  ssl: process.env.DB_SSL !== 'false',
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
  // Cap the connection pool. Default 10 == node-postgres' own default, so dev
  // (which sets no DB_POOL_MAX) behaves exactly as before this option existed.
  // Production lowers it (render.yaml / .env.render set 5) to stay well within
  // Supabase's free-tier pooler budget and avoid "too many clients" on restart.
  poolMax: parseInt(process.env.DB_POOL_MAX ?? '10', 10),
}));
