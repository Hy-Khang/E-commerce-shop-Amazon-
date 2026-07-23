import { registerAs } from '@nestjs/config';

export default registerAs('visualSearch', () => ({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  model: process.env.OPENROUTER_MODEL || 'google/gemma-4-31b-it:free',
}));
