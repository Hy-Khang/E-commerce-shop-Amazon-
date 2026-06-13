import { Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import { HomepageProductCard } from './HomepageProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import type { HomepageProductItem } from '../types/product.types';

interface Props {
  products: HomepageProductItem[];
  isLoading?: boolean;
}

const RANK_STYLES = [
  'bg-amber-500 text-white',
  'bg-neutral-400 text-white',
  'bg-amber-700 text-white',
];

function RankBadge({ rank }: { rank: number }) {
  if (rank > 3) return null;
  return (
    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shadow-sm ${RANK_STYLES[rank - 1]}`}>
      {rank}
    </span>
  );
}

export function BestSellersSection({ products, isLoading }: Props) {
  if (!isLoading && products.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-500" />
        <h2 className="font-display text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
          Best Sellers
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))
          : products.map((product, i) => (
              <HomepageProductCard
                key={product.id}
                product={product}
                badge={<RankBadge rank={i + 1} />}
              />
            ))}
      </div>
    </motion.section>
  );
}
