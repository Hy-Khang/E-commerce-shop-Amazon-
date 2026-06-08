import { Outlet, Link } from 'react-router-dom';
import { ROUTES } from '@/common/constants/routes';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-page">
      {/* Left Pane (Desktop Illustration) */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-brand to-primary-800 p-16 text-white lg:flex">
        {/* Abstract design elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.15),transparent_60%)]" />

        <div className="relative z-10">
          <Link to={ROUTES.HOME} className="inline-block">
            <span className="font-display text-4xl tracking-tight">
              Nook<span className="text-primary-300">.</span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md space-y-4">
          <h2 className="font-display text-4xl leading-tight text-primary-50">
            Handpicked items for your home and lifestyle.
          </h2>
          <p className="text-sm text-primary-100/90 leading-relaxed font-light">
            Discover a curated marketplace of thoughtful creations, crafted with care and designed to elevate your everyday living.
          </p>
        </div>

        <div className="relative z-10 text-xs text-primary-200/80">
          © {new Date().getFullYear()} Nook. All rights reserved.
        </div>
      </div>

      {/* Right Pane (Form Container) */}
      <div className="flex w-full items-center justify-center p-6 sm:p-12 lg:w-1/2 lg:p-16">
        <div className="w-full max-w-md animate-in">
          {/* Mobile Logo Wordmark */}
          <div className="mb-8 text-center lg:hidden">
            <Link to={ROUTES.HOME} className="inline-block">
              <span className="font-display text-3xl tracking-tight text-text-primary">
                Nook<span className="text-brand">.</span>
              </span>
            </Link>
          </div>
          
          <div className="shop-card bg-surface p-6 sm:p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
