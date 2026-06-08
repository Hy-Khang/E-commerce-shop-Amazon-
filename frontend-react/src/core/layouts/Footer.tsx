import { Link } from 'react-router-dom';
import { ROUTES } from '@/common/constants/routes';

export function Footer() {
  return (
    <footer className="border-t border-primary-950/30 bg-primary-900 text-primary-100">
      <div className="shop-container py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-primary-300/90">
              Customer Service
            </h3>
            <ul className="space-y-2.5 text-sm">
              <FooterLink href="#">Help Centre</FooterLink>
              <FooterLink href="#">How To Buy</FooterLink>
              <FooterLink href="#">Shipping & Delivery</FooterLink>
              <FooterLink href="#">Returns & Refunds</FooterLink>
              <FooterLink href="#">Contact Us</FooterLink>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-primary-300/90">
              About Nook
            </h3>
            <ul className="space-y-2.5 text-sm">
              <FooterLink href="#">About Us</FooterLink>
              <FooterLink href="#">Careers</FooterLink>
              <FooterLink href="#">Privacy Policy</FooterLink>
              <FooterLink href="#">Terms of Service</FooterLink>
              <FooterLink to={ROUTES.PRODUCTS}>Browse Products</FooterLink>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-primary-300/90">
              Payment & Shipping
            </h3>
            <div className="flex flex-wrap gap-2">
              <PaymentBadge>COD</PaymentBadge>
              <PaymentBadge>VISA</PaymentBadge>
              <PaymentBadge>MoMo</PaymentBadge>
              <PaymentBadge>Banking</PaymentBadge>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-primary-300/90">
              Follow Us
            </h3>
            <ul className="space-y-2.5 text-sm">
              <FooterLink href="#">Facebook</FooterLink>
              <FooterLink href="#">Instagram</FooterLink>
              <FooterLink href="#">Twitter</FooterLink>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-primary-950/30 bg-primary-950/20">
        <div className="shop-container flex flex-col items-center justify-between gap-2 py-6 text-xs text-primary-400 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Nook. All rights reserved.</p>
          <p>Country: Vietnam</p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  to,
  children,
}: {
  href?: string;
  to?: string;
  children: React.ReactNode;
}) {
  const className = "text-primary-300/80 hover:text-white transition-colors";
  if (to) {
    return <li><Link to={to} className={className}>{children}</Link></li>;
  }
  return <li><a href={href} className={className}>{children}</a></li>;
}

function PaymentBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-lg bg-primary-850 border border-primary-750/30 px-3 py-1.5 text-xs font-semibold text-primary-200">
      {children}
    </span>
  );
}
