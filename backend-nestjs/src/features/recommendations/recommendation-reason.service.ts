import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h — category-level copy is stable
const LLM_TIMEOUT_MS = 4000;

/**
 * Builds the "Recommended for You" reason label. Deterministic rule-based by
 * default ("Because you like {category}"); when `recommendations.aiReason` is
 * enabled it phrases a friendlier one-liner via the OpenRouter chat model
 * (reusing the AI Chatbox key/model), cached in-memory per category so the
 * homepage carousel never pays LLM latency on a warm cache. Any miss — flag
 * off, no API key, HTTP error, or timeout — falls back to the rule-based label,
 * so the response contract (`reason: string | null`) is unchanged and no request
 * is ever blocked by the LLM.
 */
@Injectable()
export class RecommendationReasonService {
  private readonly logger = new Logger(RecommendationReasonService.name);
  private readonly cache = new Map<number, { text: string; exp: number }>();

  constructor(private readonly configService: ConfigService) {}

  /** Rule-based fallback label. */
  static fallback(categoryName: string): string {
    return `Because you like ${categoryName}`;
  }

  /**
   * Reason copy for the dominant category. Returns the AI-phrased line when the
   * feature is enabled and reachable, else the rule-based fallback.
   */
  async describe(categoryId: number, categoryName: string): Promise<string> {
    const fallback = RecommendationReasonService.fallback(categoryName);

    const enabled = this.configService.get<boolean>('recommendations.aiReason');
    const apiKey = this.configService.get<string>('chatbot.apiKey');
    if (!enabled || !apiKey) return fallback;

    const cached = this.cache.get(categoryId);
    if (cached && cached.exp > Date.now()) return cached.text;

    try {
      const text = await this.generate(categoryName, apiKey);
      const line = text ?? fallback;
      this.cache.set(categoryId, { text: line, exp: Date.now() + CACHE_TTL_MS });
      return line;
    } catch (err) {
      // Best-effort — never block the carousel on the LLM.
      this.logger.warn(
        `AI reason generation failed, using fallback: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return fallback;
    }
  }

  /** One bounded OpenRouter chat call → a short reason line (or null). */
  private async generate(
    categoryName: string,
    apiKey: string,
  ): Promise<string | null> {
    const baseUrl = this.configService.get<string>('chatbot.baseUrl');
    const model = this.configService.get<string>('chatbot.chatModel');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.6,
          max_tokens: 40,
          messages: [
            {
              role: 'system',
              content:
                'You write a single short storefront recommendation reason in English. ' +
                'Max 12 words, friendly, no quotes, no emoji, start with "Because".',
            },
            {
              role: 'user',
              content: `The shopper mostly browses the category "${categoryName}". Write the reason line.`,
            },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`OpenRouter returned status ${response.status}`);
      }
      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content;
      return this.sanitize(typeof raw === 'string' ? raw : null);
    } finally {
      clearTimeout(timer);
    }
  }

  /** Trim quotes/whitespace and guard against a runaway response. */
  private sanitize(raw: string | null): string | null {
    if (!raw) return null;
    const line = raw.trim().replace(/^["']|["']$/g, '').split('\n')[0].trim();
    if (line.length < 3 || line.length > 120) return null;
    return line;
  }
}
