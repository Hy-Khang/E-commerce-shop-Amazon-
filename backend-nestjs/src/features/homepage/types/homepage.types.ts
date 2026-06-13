export interface IProductSummary {
  id: number;
  name: string;
  slug: string;
  thumbnailUrl: string | null;
  price: number;
  originalPrice: number | null;
  maxDiscountPercent: number | null;
  inStock: boolean;
}

export interface ITrendingProduct extends IProductSummary {
  wishlistCount: number;
}

export interface IHomepageData {
  specialOffers: IProductSummary[];
  bestSellers: IProductSummary[];
  trending: ITrendingProduct[];
  discoverMore: IProductSummary[];
}
