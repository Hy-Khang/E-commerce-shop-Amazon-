import { Link } from 'react-router-dom';
import { User, MapPin, MessageSquare } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { ProfileForm } from '../components/ProfileForm';
import { ROUTES } from '@/common/constants/routes';

export default function ProfilePage() {
  const { data: profile, isLoading, error } = useProfile();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-64 rounded-lg bg-gray-200" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          Failed to load profile. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">My Profile</h1>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{profile.full_name}</p>
            <p className="text-sm text-gray-500">{profile.email}</p>
          </div>
        </div>

        <ProfileForm profile={profile} />
      </div>

      <Link
        to={ROUTES.ADDRESSES}
        className="mt-6 flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition hover:bg-gray-50"
      >
        <MapPin className="h-5 w-5 text-gray-400" />
        <div>
          <p className="font-medium text-gray-900">Shipping Addresses</p>
          <p className="text-sm text-gray-500">Manage your delivery addresses</p>
        </div>
      </Link>

      <Link
        to={ROUTES.MY_REVIEWS}
        className="mt-3 flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition hover:bg-gray-50"
      >
        <MessageSquare className="h-5 w-5 text-gray-400" />
        <div>
          <p className="font-medium text-gray-900">My Reviews</p>
          <p className="text-sm text-gray-500">View and manage your product reviews</p>
        </div>
      </Link>
    </div>
  );
}
