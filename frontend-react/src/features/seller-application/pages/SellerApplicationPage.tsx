import {
  Loader2,
  Store,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { formatDate } from '@/common/utils/format.util';
import { useMyApplication } from '../hooks/useSellerApplication';
import { useEnterSellerCenter } from '../hooks/useEnterSellerCenter';
import { SellerApplicationForm } from '../components/SellerApplicationForm';

export default function SellerApplicationPage() {
  const { data: application, isLoading } = useMyApplication();
  const { enter, isEntering } = useEnterSellerCenter();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
      </div>
    );
  }

  const status = application?.status;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Store className="h-6 w-6 text-text-brand" />
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Become a seller
          </h1>
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          Sell on Nook — open your shop and start doing business.
        </p>
      </div>

      {status === 'pending' && (
        <div className="shop-card space-y-3 border-amber-200 bg-gradient-to-br from-amber-50 to-elevated p-6">
          <div className="flex items-center gap-2 text-amber-700">
            <Clock className="h-5 w-5" />
            <span className="text-sm font-semibold">Application under review</span>
          </div>
          <p className="text-sm text-text-secondary">
            Your application for shop <strong>{application?.shop_name}</strong> was
            submitted on {formatDate(application!.created_at)}. We'll review it and
            get back to you soon.
          </p>
        </div>
      )}

      {status === 'approved' && (
        <div className="shop-card space-y-4 border-emerald-200 bg-gradient-to-br from-emerald-50 to-elevated p-6">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-semibold">Application approved</span>
          </div>
          <p className="text-sm text-text-secondary">
            Congratulations! Shop <strong>{application?.shop_name}</strong> is now
            active. Enter the Seller Center to start selling.
          </p>
          <button
            onClick={enter}
            disabled={isEntering}
            className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-brand-hover disabled:opacity-50"
          >
            {isEntering ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            Enter Seller Center
          </button>
        </div>
      )}

      {status === 'rejected' && (
        <>
          <div className="shop-card space-y-2 border-rose-200 bg-gradient-to-br from-rose-50 to-elevated p-6">
            <div className="flex items-center gap-2 text-rose-700">
              <XCircle className="h-5 w-5" />
              <span className="text-sm font-semibold">Application rejected</span>
            </div>
            {application?.reject_reason ? (
              <p className="text-sm text-text-secondary">
                Reason: {application.reject_reason}
              </p>
            ) : (
              <p className="text-sm text-text-secondary">
                Your application was not approved. You can edit it and resubmit.
              </p>
            )}
          </div>
          <SellerApplicationForm
            defaultValues={{
              shop_name: application?.shop_name,
              phone: application?.phone,
              business_name: application?.business_name ?? '',
              tax_id: application?.tax_id ?? '',
              description: application?.description ?? '',
            }}
          />
        </>
      )}

      {!application && <SellerApplicationForm />}
    </div>
  );
}
