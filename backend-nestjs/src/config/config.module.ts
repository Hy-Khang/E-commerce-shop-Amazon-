import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import appConfig from './app.config';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';
import mailConfig from './mail.config';
import oauthConfig from './oauth.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, mailConfig, oauthConfig],
      validationSchema: Joi.object({
        APP_PORT: Joi.number().default(3000),
        APP_PREFIX: Joi.string().default('api/v1'),
        CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(1433),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_REFRESH_EXPIRY: Joi.string().default('7d'),
        FRONTEND_URL: Joi.string().default('http://localhost:5173'),
        SMTP_HOST: Joi.string().optional().default('sandbox.smtp.mailtrap.io'),
        SMTP_PORT: Joi.number().optional().default(2525),
        SMTP_USER: Joi.string().optional().allow('').default(''),
        SMTP_PASS: Joi.string().optional().allow('').default(''),
        SMTP_FROM: Joi.string().optional().default('noreply@ecommerce.local'),
        GOOGLE_CLIENT_ID: Joi.string().optional().allow('').default(''),
        GOOGLE_CLIENT_SECRET: Joi.string().optional().allow('').default(''),
        GOOGLE_CALLBACK_URL: Joi.string().optional().default('http://localhost:3000/api/v1/auth/google/callback'),
        FACEBOOK_APP_ID: Joi.string().optional().allow('').default(''),
        FACEBOOK_APP_SECRET: Joi.string().optional().allow('').default(''),
        FACEBOOK_CALLBACK_URL: Joi.string().optional().default('http://localhost:3000/api/v1/auth/facebook/callback'),
      }),
    }),
  ],
})
export class AppConfigModule {}
