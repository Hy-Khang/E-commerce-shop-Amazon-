import { useProfile } from '../hooks/useProfile';
import { ProfileForm } from '../components/ProfileForm';

export default function ProfilePage() {
  const { data: profile, isLoading, error } = useProfile();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 rounded bg-neutral-200 animate-pulse" />
        <div className="space-y-4">
          <div className="h-10 rounded bg-neutral-200 animate-pulse" />
          <div className="h-10 rounded bg-neutral-200 animate-pulse" />
          <div className="h-10 rounded bg-neutral-200 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-sm text-rose-800">
        Failed to load profile. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary">My Profile</h1>
        <p className="mt-1 text-sm text-text-secondary">Manage your personal account settings and details.</p>
      </div>

      <div className="border-t border-border-default pt-6">
        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}

