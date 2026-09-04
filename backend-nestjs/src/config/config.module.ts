import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import appConfig from './app.config';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';
import mailConfig from './mail.config';
import oauthConfig from './oauth.config';
import vnpayConfig from './vnpay.config';
import momoConfig from './momo.config';
import visualSearchConfig from './grok.config';
import chatbotConfig from './chatbot.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        mailConfig,
        oauthConfig,
        vnpayConfig,
        momoConfig,
        visualSearchConfig,
        chatbotConfig,
      ],
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
        GOOGLE_CALLBACK_URL: Joi.string()
          .optional()
          .default('http://localhost:3000/api/v1/auth/google/callback'),
        FACEBOOK_APP_ID: Joi.string().optional().allow('').default(''),
        FACEBOOK_APP_SECRET: Joi.string().optional().allow('').default(''),
        FACEBOOK_CALLBACK_URL: Joi.string()
          .optional()
          .default('http://localhost:3000/api/v1/auth/facebook/callback'),
        // VNPay (optional)
        VNPAY_TMN_CODE: Joi.string().optional().allow('').default(''),
        VNPAY_HASH_SECRET: Joi.string().optional().allow('').default(''),
        VNPAY_PAYMENT_URL: Joi.string()
          .optional()
          .default('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'),
        VNPAY_RETURN_URL: Joi.string()
          .optional()
          .default('http://localhost:3000/api/v1/payments/vnpay/return'),
        // MoMo (optional)
        MOMO_PARTNER_CODE: Joi.string().optional().allow('').default(''),
        MOMO_ACCESS_KEY: Joi.string().optional().allow('').default(''),
        MOMO_SECRET_KEY: Joi.string().optional().allow('').default(''),
        MOMO_ENDPOINT: Joi.string()
          .optional()
          .default('https://test-payment.momo.vn/v2/gateway/api/create'),
        MOMO_RETURN_URL: Joi.string()
          .optional()
          .default('http://localhost:3000/api/v1/payments/momo/return'),
        MOMO_IPN_URL: Joi.string()
          .optional()
          .default('http://localhost:3000/api/v1/payments/momo/ipn'),
        // Visual Search — OpenRouter (optional)
        OPENROUTER_API_KEY: Joi.string().optional().allow('').default(''),
        OPENROUTER_BASE_URL: Joi.string()
          .optional()
          .default('https://openrouter.ai/api/v1'),
        OPENROUTER_MODEL: Joi.string()
          .optional()
          .default('google/gemma-4-31b-it:free'),
        // AI Chatbox — OpenRouter text chat model (optional; reuses OPENROUTER_API_KEY)
        OPENROUTER_CHAT_MODEL: Joi.string()
          .optional()
          .default('google/gemma-4-31b-it:free'),
        // AI Shopping Agent — tool-calling-capable model (optional; falls back to OPENROUTER_CHAT_MODEL)
        OPENROUTER_AGENT_MODEL: Joi.string().optional().allow('').default(''),
      }),
    }),
  ],
})
export class AppConfigModule {}
