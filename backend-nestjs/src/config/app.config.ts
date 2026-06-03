import { registerAs } from '@nestjs/config';
import { resolve, join } from 'path';

export default registerAs('app', () => ({
  port: parseInt(process.env.APP_PORT ?? '3000', 10),
  prefix: process.env.APP_PREFIX || 'api/v1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  uploadDir: resolve(
    process.env.UPLOAD_DIR || join(__dirname, '..', '..', 'uploads'),
  ),
}));
