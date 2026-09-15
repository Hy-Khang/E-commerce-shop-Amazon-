import { api } from '@/core/api/axios-instance';
import type { SuccessResponse } from '@/core/api/api.types';
import type {
  ProductListResult,
  RecommendationsResult,
  TrackActivityRequest,
} from '../types/recommendations.types';

export const recommendationsService = {
  // "Recommended for You" — personalized set + reason. JWT / x-session-id auto-attached.
  getRecommendations: (limit = 12) =>
    api.get<SuccessResponse<RecommendationsResult>>('/recommendations', {
      params: { limit },
    }),

  getSimilar: (productId: number, limit = 12) =>
    api.get<SuccessResponse<ProductListResult>>(
      `/products/${productId}/similar`,
      { params: { limit } },
    ),

  getFrequentlyBoughtTogether: (productId: number, limit = 12) =>
    api.get<SuccessResponse<ProductListResult>>(
      `/products/${productId}/frequently-bought-together`,
      { params: { limit } },
    ),

  // Best-effort behavioral signal — never surfaced to the user.
  track: (body: TrackActivityRequest) => api.post('/activity', body),
};
