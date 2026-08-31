import { registerAs } from '@nestjs/config';

/**
 * AI Chatbox (Module 21) config. Reuses the same OpenRouter API key + base URL
 * as Visual Search (Module 12). Defaults to the same known-good free model as
 * Visual Search (`google/gemma-4-31b-it:free`) — strong Vietnamese and already
 * proven on this key. Override with `OPENROUTER_CHAT_MODEL` if you want a
 * different chat model (free `:free` slugs come and go on OpenRouter).
 */
export default registerAs('chatbot', () => ({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  chatModel:
    process.env.OPENROUTER_CHAT_MODEL ||
    process.env.OPENROUTER_MODEL ||
    'google/gemma-4-31b-it:free',
}));
