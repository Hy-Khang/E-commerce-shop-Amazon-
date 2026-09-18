import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/common/constants/routes';

export function Footer() {
  const { t } = useTranslation('nav');
  return (
    <footer className="border-t border-primary-950/30 bg-primary-900 text-primary-100">
      <div className="shop-container py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-primary-300/90">
              {t('footer.customerService')}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <FooterLink href="#">{t('footer.helpCentre')}</FooterLink>
              <FooterLink href="#">{t('footer.howToBuy')}</FooterLink>
              <FooterLink href="#">{t('footer.shippingDelivery')}</FooterLink>
              <FooterLink href="#">{t('footer.returnsRefunds')}</FooterLink>
              <FooterLink href="#">{t('footer.contactUs')}</FooterLink>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-primary-300/90">
              {t('footer.aboutNook')}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <FooterLink href="#">{t('footer.aboutUs')}</FooterLink>
              <FooterLink href="#">{t('footer.careers')}</FooterLink>
              <FooterLink href="#">{t('footer.privacyPolicy')}</FooterLink>
              <FooterLink href="#">{t('footer.termsOfService')}</FooterLink>
              <FooterLink to={ROUTES.PRODUCTS}>{t('footer.browseProducts')}</FooterLink>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-primary-300/90">
              {t('footer.paymentShipping')}
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
              {t('footer.followUs')}
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
          <p>{t('footer.rights', { year: new Date().getFullYear() })}</p>
          <p>{t('footer.country')}</p>
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
