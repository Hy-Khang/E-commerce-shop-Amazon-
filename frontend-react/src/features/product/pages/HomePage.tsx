import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Truck, ShieldCheck, HelpCircle, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ROUTES } from '@/common/constants/routes';
import { Button } from '@/common/components/ui/Button';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useHomepage } from '../hooks/useHomepage';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';
import { SpecialOffersSection } from '../components/SpecialOffersSection';
import { FeaturedCategoriesSection } from '../components/FeaturedCategoriesSection';
import { PromotionalBanner } from '../components/PromotionalBanner';
import { BestSellersSection } from '../components/BestSellersSection';
import { TrendingSection } from '../components/TrendingSection';
import { DiscoverMoreSection } from '../components/DiscoverMoreSection';
import { FlashSaleSection } from '@/features/flash-sale';
import { RecentlyViewedCarousel } from '@/features/recently-viewed';
import { RecommendedForYouCarousel } from '@/features/recommendations';

const HERO_SLIDES = [
  {
    id: 1,
    badge: "New Arrival Collection",
    title: "Curated Essentials For Modern Living",
    description: "Explore our handpicked collection of thoughtfully crafted and beautifully designed everyday objects.",
    cta: "Shop New Arrivals",
    link: ROUTES.PRODUCTS,
    bgClass: "from-primary-900 via-primary-900/95 to-primary-800",
    textClass: "text-white",
    dotClass: "bg-white",
  },
  {
    id: 2,
    badge: "Conscious Crafting",
    title: "Simplicity In Natural Materials",
    description: "Bring organic textures and premium sustainable materials into your dining and living spaces.",
    cta: "Explore Collection",
    link: ROUTES.PRODUCTS + '?search=minimal',
    bgClass: "from-neutral-100 to-neutral-200/60 border border-neutral-200/50 dark:from-neutral-800 dark:to-neutral-900/60 dark:border-neutral-700/50",
    textClass: "text-text-primary",
    dotClass: "bg-text-primary",
  },
  {
    id: 3,
    badge: "Limited Edition",
    title: "Elegance Meets Everyday Utility",
    description: "Functional storage solutions and organization accessories crafted for absolute detail.",
    cta: "Browse Utility",
    link: ROUTES.PRODUCTS + '?search=storage',
    bgClass: "from-primary-850 via-primary-900/90 to-neutral-900",
    textClass: "text-white",
    dotClass: "bg-white",
  }
];

const VALUE_PROPS = [
  {
    icon: Truck,
    title: "Free Delivery",
    desc: "On orders above 500K₫",
  },
  {
    icon: Sparkles,
    title: "Craft Quality",
    desc: "Premium natural materials",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payment",
    desc: "100% encrypted checkout",
  },
  {
    icon: HelpCircle,
    title: "Expert Assistance",
    desc: "24/7 client care support",
  }
];

export default function HomePage() {
  const { data: newArrivals, isLoading: isLoadingNewArrivals } = useProducts({ page: 1, limit: 12, sort: 'created_at', order: 'desc' });
  const { data: categories } = useCategories();
  const { data: homepage, isLoading: isLoadingHomepage } = useHomepage();

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  function handlePrev() {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }

  function handleNext() {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  }

  return (
    <div className="space-y-16 pb-8">
      {/* ── 1. Hero Animated Carousel ── */}
      <div className="relative group overflow-hidden rounded-2xl h-[300px] sm:h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.01 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className={`absolute inset-0 bg-gradient-to-br p-8 sm:p-16 flex flex-col justify-center select-none ${HERO_SLIDES[currentSlide].bgClass} ${HERO_SLIDES[currentSlide].textClass}`}
          >
            <div className="max-w-xl space-y-4">
              <span className="inline-block rounded-full bg-brand-light/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand">
                {HERO_SLIDES[currentSlide].badge}
              </span>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl leading-tight">
                {HERO_SLIDES[currentSlide].title}
              </h1>
              <p className="text-xs opacity-90 sm:text-sm max-w-md leading-relaxed">
                {HERO_SLIDES[currentSlide].description}
              </p>
              <div className="pt-2">
                <Link to={HERO_SLIDES[currentSlide].link}>
                  <Button variant={HERO_SLIDES[currentSlide].textClass === 'text-white' ? 'brand' : 'primary'}>
                    {HERO_SLIDES[currentSlide].cta}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <button
          onClick={handlePrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {HERO_SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${
                currentSlide === index ? 'w-6 opacity-100' : 'w-2 opacity-50'
              } ${HERO_SLIDES[currentSlide].dotClass}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ── 2. Value Propositions Banner ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 border border-border-default/80 bg-surface-hover/40 rounded-xl p-6">
        {VALUE_PROPS.map((prop, i) => {
          const Icon = prop.icon;
          return (
            <div key={i} className="flex gap-3 items-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-light">
                <Icon className="h-5 w-5 text-text-brand" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text-primary">{prop.title}</h4>
                <p className="text-xs text-text-muted mt-0.5">{prop.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Flash Sale ── */}
      <FlashSaleSection />

      {/* ── 3. Special Offers ── */}
      <SpecialOffersSection
        products={homepage?.specialOffers ?? []}
        isLoading={isLoadingHomepage}
      />

      {/* ── 4. Featured Categories ── */}
      {categories && <FeaturedCategoriesSection categories={categories} />}

      {/* ── 5. Promotional Banner ── */}
      <PromotionalBanner />

      {/* ── 6. Best Sellers ── */}
      <BestSellersSection
        products={homepage?.bestSellers ?? []}
        isLoading={isLoadingHomepage}
      />

      {/* ── 7. Trending Now ── */}
      <TrendingSection
        products={homepage?.trending ?? []}
        isLoading={isLoadingHomepage}
      />

      {/* ── 8. Discover More ── */}
      <DiscoverMoreSection
        products={homepage?.discoverMore ?? []}
        isLoading={isLoadingHomepage}
      />

      {/* ── Recommended for You ── */}
      <RecommendedForYouCarousel />

      {/* ── Recently Viewed ── */}
      <RecentlyViewedCarousel />

      {/* ── 9. New Arrivals ── */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
            New Arrivals
          </h2>
          <Link
            to={ROUTES.PRODUCTS}
            className="text-sm font-semibold text-text-brand hover:text-primary-700 transition-colors"
          >
            View all
          </Link>
        </div>

        {isLoadingNewArrivals ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : newArrivals && newArrivals.data.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {newArrivals.data.map((product) => (
              <div key={product.id} className="relative">
                <ProductCard product={product} />
                <span className="absolute left-2 top-2 z-10 rounded-full bg-primary-500 px-2 py-0.5 text-xs font-bold text-white">
                  NEW
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-text-secondary">No products available yet.</div>
        )}
      </motion.section>
    </div>
  );
}
