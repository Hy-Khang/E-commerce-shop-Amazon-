import { ConfigService } from '@nestjs/config';
import { RecommendationReasonService } from '../recommendation-reason.service';

/** Build a service with a config map + optional AI enablement. */
function makeService(overrides: Record<string, unknown>) {
  const config = {
    'chatbot.baseUrl': 'https://openrouter.test/api/v1',
    'chatbot.chatModel': 'test-model',
    ...overrides,
  } as Record<string, unknown>;
  const configService = {
    get: jest.fn((key: string) => config[key]),
  } as unknown as ConfigService;
  return new RecommendationReasonService(configService);
}

function mockFetchOnce(content: string) {
  return jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ choices: [{ message: { content } }] }),
  });
}

describe('RecommendationReasonService', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
    jest.restoreAllMocks();
  });

  it('returns the rule-based fallback when the feature is disabled', async () => {
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy as any;
    const service = makeService({
      'recommendations.aiReason': false,
      'chatbot.apiKey': 'key',
    });

    await expect(service.describe(5, 'Áo thun')).resolves.toBe(
      'Because you like Áo thun',
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns the fallback when enabled but no API key is configured', async () => {
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy as any;
    const service = makeService({
      'recommendations.aiReason': true,
      'chatbot.apiKey': '',
    });

    await expect(service.describe(5, 'Sách')).resolves.toBe(
      'Because you like Sách',
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns the AI-phrased line when enabled and reachable, then caches it', async () => {
    const fetchSpy = mockFetchOnce('Because you love fresh streetwear looks');
    global.fetch = fetchSpy as any;
    const service = makeService({
      'recommendations.aiReason': true,
      'chatbot.apiKey': 'key',
    });

    const first = await service.describe(5, 'Áo thun');
    const second = await service.describe(5, 'Áo thun');

    expect(first).toBe('Because you love fresh streetwear looks');
    expect(second).toBe(first);
    expect(fetchSpy).toHaveBeenCalledTimes(1); // second served from cache
  });

  it('falls back to the rule-based label when the LLM call fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network')) as any;
    const service = makeService({
      'recommendations.aiReason': true,
      'chatbot.apiKey': 'key',
    });

    await expect(service.describe(9, 'Giày dép')).resolves.toBe(
      'Because you like Giày dép',
    );
  });

  it('rejects an over-long / empty model response and uses the fallback', async () => {
    global.fetch = mockFetchOnce('   ') as any;
    const service = makeService({
      'recommendations.aiReason': true,
      'chatbot.apiKey': 'key',
    });

    await expect(service.describe(3, 'Điện tử')).resolves.toBe(
      'Because you like Điện tử',
    );
  });
});
