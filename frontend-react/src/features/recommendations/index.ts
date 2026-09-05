// Components
export { RecommendedForYouCarousel } from './components/RecommendedForYouCarousel';
export { SimilarProductsCarousel } from './components/SimilarProductsCarousel';
export { FrequentlyBoughtTogetherCarousel } from './components/FrequentlyBoughtTogetherCarousel';

// Hooks
export {
  recommendationKeys,
  useRecommendedForYou,
} from './hooks/useRecommendedForYou';
export { useSimilarProducts } from './hooks/useSimilarProducts';
export { useFrequentlyBoughtTogether } from './hooks/useFrequentlyBoughtTogether';
export {
  useTrackActivity,
  useTrackActivityCallback,
} from './hooks/useTrackActivity';

// Types
export type {
  ActivityAction,
  ActivityTargetType,
  TrackActivityRequest,
  RecommendationsResult,
  ProductListResult,
} from './types/recommendations.types';
