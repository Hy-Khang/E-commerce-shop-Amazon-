import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { HeroBlockData } from '../../../types/decoration.types';

interface Props {
  data: HeroBlockData;
}

/**
 * Full-width hero slideshow. Cross-fades through `images` (autoplay unless
 * disabled), with an optional heading/tagline/CTA overlay. Storefront tokens.
 */
export function HeroBlock({ data }: Props) {
  const images = data.images.filter(Boolean);
  const [index, setIndex] = useState(0);
  const autoplay = data.autoplay !== false && images.length > 1;

  useEffect(() => {
    if (!autoplay) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [autoplay, images.length]);

  if (images.length === 0) return null;

  return (
    <section className="relative h-56 w-full overflow-hidden rounded-xl bg-surface-hover sm:h-80">
      <AnimatePresence initial={false}>
        <motion.img
          key={index}
          src={images[index]}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      </AnimatePresence>

      {(data.heading || data.tagline || data.cta) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/30 px-6 text-center">
          {data.heading && (
            <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow sm:text-4xl">
              {data.heading}
            </h2>
          )}
          {data.tagline && (
            <p className="max-w-2xl text-sm text-white/90 drop-shadow sm:text-base">
              {data.tagline}
            </p>
          )}
          {data.cta && data.cta.href && (
            <a
              href={data.cta.href}
              className="mt-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--shop-accent, var(--color-primary-500, #16a34a))' }}
            >
              {data.cta.label}
            </a>
          )}
        </div>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
