import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Store, ExternalLink, Calendar, ShieldCheck, ShieldBan, ShieldAlert } from 'lucide-react';
import { formatDate } from '@/common/utils/format.util';
import { ROUTES } from '@/common/constants/routes';
import { Button } from '@/common/components/ui/Button';
import { useAdminShop } from '../hooks/useAdminShop';
import { useUpdateShopStatus } from '../hooks/useUpdateShopStatus';
import { ShopStatusBadge } from '../components/ShopStatusBadge';
import type { ShopStatus } from '../types/shop.types';

const statusActions: { target: ShopStatus; label: string; variant: 'primary' | 'secondary' | 'danger'; icon: typeof ShieldCheck }[] = [
  { target: 'active', label: 'Activate', variant: 'primary', icon: ShieldCheck },
  { target: 'suspended', label: 'Suspend', variant: 'secondary', icon: ShieldAlert },
  { target: 'banned', label: 'Ban', variant: 'danger', icon: ShieldBan },
];

export default function AdminShopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const shopId = Number(id);

  const { data: shop, isLoading } = useAdminShop(shopId);
  const updateStatus = useUpdateShopStatus();

  function handleStatusChange(status: ShopStatus) {
    updateStatus.mutate({ id: shopId, status });
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400 dark:text-slate-500" />
      </div>
    );
  }

  if (!shop) {
    return <div className="text-slate-500 dark:text-slate-400">Shop not found.</div>;
  }

  const availableActions = statusActions.filter((a) => a.target !== shop.status);

  return (
    <div className="space-y-6">
      <Link
        to={ROUTES.ADMIN_SHOPS}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Shops
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-slate-100 ring-1 ring-slate-200/60 dark:from-teal-500/10 dark:to-slate-800 dark:ring-white/10">
            {shop.logo_url ? (
              <img src={shop.logo_url} alt={shop.name} className="h-14 w-14 rounded-xl object-cover" />
            ) : (
              <Store className="h-6 w-6 text-slate-400 dark:text-slate-500" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{shop.name}</h1>
            <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="font-mono">/{shop.slug}</span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span>Owner #{shop.user_id}</span>
            </p>
          </div>
        </div>
        <ShopStatusBadge status={shop.status} size="md" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="admin-card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Shop Profile</h2>

          {shop.banner_url && (
            <div className="mt-4 overflow-hidden rounded-lg">
              <img
                src={shop.banner_url}
                alt="Shop banner"
                className="h-32 w-full object-cover"
              />
            </div>
          )}

          <dl className="mt-4 space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500 dark:text-slate-400">Name</dt>
              <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">{shop.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500 dark:text-slate-400">Slug</dt>
              <dd className="font-mono text-sm text-slate-600 dark:text-slate-300">/{shop.slug}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500 dark:text-slate-400">Description</dt>
              <dd className="max-w-xs text-right text-sm text-slate-900 dark:text-slate-100">
                {shop.description || <span className="text-slate-400 italic dark:text-slate-500">No description</span>}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500 dark:text-slate-400">Created</dt>
              <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">{formatDate(shop.created_at)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500 dark:text-slate-400">Updated</dt>
              <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">{formatDate(shop.updated_at)}</dd>
            </div>
          </dl>

          {shop.status === 'active' && (
            <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
              <Link
                to={ROUTES.SHOP_PROFILE(shop.slug)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors dark:text-teal-400 dark:hover:text-teal-300"
              >
                View public profile
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Moderation Timeline */}
        <div className="admin-card p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Moderation</h2>
          <div className="mt-4 space-y-4">
            <TimelineItem
              icon={Calendar}
              label="Created"
              date={shop.created_at}
              color="text-slate-400"
            />
            {shop.verified_at && (
              <TimelineItem
                icon={ShieldCheck}
                label="Verified"
                date={shop.verified_at}
                detail={shop.verified_by ? `by admin #${shop.verified_by}` : undefined}
                color="text-emerald-500"
              />
            )}
            {shop.suspended_at && (
              <TimelineItem
                icon={ShieldAlert}
                label="Suspended"
                date={shop.suspended_at}
                color="text-orange-500"
              />
            )}
            {shop.banned_at && (
              <TimelineItem
                icon={ShieldBan}
                label="Banned"
                date={shop.banned_at}
                color="text-rose-500"
              />
            )}
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="admin-card p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Admin Actions</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Change shop status. Setting to active will verify the shop if not already verified.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {availableActions.map((action) => (
            <Button
              key={action.target}
              variant={action.variant}
              icon={action.icon}
              onClick={() => handleStatusChange(action.target)}
              loading={updateStatus.isPending}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineItem({
  icon: Icon,
  label,
  date,
  detail,
  color,
}: {
  icon: typeof Calendar;
  label: string;
  date: string;
  detail?: string;
  color: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(date)}</p>
        {detail && <p className="text-xs text-slate-400 dark:text-slate-500">{detail}</p>}
      </div>
    </div>
  );
}
