import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { HOMEPAGE_PROMO } from '../constants/homepage.constants';

export function PromotionalBanner() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5 }}
      className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700"
    >
      <div className="grid grid-cols-1 md:grid-cols-5">
        <div className="col-span-3 flex flex-col justify-center p-8 sm:p-10">
          <span className="mb-2 inline-block w-fit rounded-full bg-primary-600/40 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary-200">
            Limited time offer
          </span>
          <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">
            {HOMEPAGE_PROMO.heading}
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-primary-200/90">
            {HOMEPAGE_PROMO.description}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <div className="rounded-lg border-2 border-dashed border-primary-400/50 bg-primary-800/50 px-4 py-2">
              <span className="font-mono text-lg font-bold tracking-wider text-white">
                {HOMEPAGE_PROMO.code}
              </span>
            </div>
            <Link
              to={HOMEPAGE_PROMO.ctaLink}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-primary-800 shadow-sm transition-colors hover:bg-primary-50"
            >
              {HOMEPAGE_PROMO.ctaText}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="relative col-span-2 hidden md:block">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-primary-600)_0%,_transparent_70%)] opacity-30" />
          <div className="flex h-full items-center justify-center">
            <span className="select-none font-display text-[120px] font-semibold leading-none text-primary-600/10">
              {HOMEPAGE_PROMO.discount}
            </span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
