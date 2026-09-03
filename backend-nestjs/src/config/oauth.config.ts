import { registerAs } from '@nestjs/config';

export default registerAs('oauth', () => ({
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:3000/api/v1/auth/google/callback',
  },
  facebook: {
    appId: process.env.FACEBOOK_APP_ID || '',
    appSecret: process.env.FACEBOOK_APP_SECRET || '',
    callbackUrl:
      process.env.FACEBOOK_CALLBACK_URL ||
      'http://localhost:3000/api/v1/auth/facebook/callback',
  },
}));
