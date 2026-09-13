import { registerAs } from '@nestjs/config';

/**
 * Smart Recommendations (Module 22) runtime config.
 *
 * `aiReason` gates the optional AI-generated "reason" copy on
 * `GET /recommendations`. Default OFF — the endpoint keeps the deterministic
 * rule-based label ("Because you like {category}") with zero LLM latency/cost.
 * When ON, the reason is phrased by the OpenRouter chat model (reusing the AI
 * Chatbox key/model), cached in-memory per category, and falls back to the
 * rule-based label on any miss (no key / error / timeout).
 */
export default registerAs('recommendations', () => ({
  aiReason: process.env.RECOMMENDATIONS_AI_REASON === 'true',
}));
