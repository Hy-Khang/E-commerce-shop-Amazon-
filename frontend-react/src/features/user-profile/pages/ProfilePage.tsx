import { useTranslation } from 'react-i18next';
import { useProfile } from '../hooks/useProfile';
import { ProfileForm } from '../components/ProfileForm';
import { ChangePasswordForm } from '@/features/auth';

export default function ProfilePage() {
  const { t } = useTranslation('userProfile');
  const { data: profile, isLoading, error } = useProfile();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
        <div className="space-y-4">
          <div className="h-10 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
          <div className="h-10 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
          <div className="h-10 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-sm text-rose-800">
        {t('page.loadError')}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary">{t('page.title')}</h1>
        <p className="mt-1 text-sm text-text-secondary">{t('page.subtitle')}</p>
      </div>

      <div className="border-t border-border-default pt-6">
        <ProfileForm profile={profile} />
      </div>

      <div className="border-t border-border-default pt-6">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">{t('page.security')}</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
