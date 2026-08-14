export type {
  UserProfile,
  Address,
  CreateAddressRequest,
  UpdateAddressRequest,
  AddressFormData,
} from './types/user-profile.types';
export { addressSchema, updateProfileSchema } from './types/user-profile.types';

export { useProfile, profileKeys } from './hooks/useProfile';
export { useUpdateProfile } from './hooks/useUpdateProfile';
export { useAddresses, addressKeys } from './hooks/useAddresses';
export { useCreateAddress } from './hooks/useCreateAddress';
export { useUpdateAddress } from './hooks/useUpdateAddress';
export { useDeleteAddress } from './hooks/useDeleteAddress';
export { useSetDefaultAddress } from './hooks/useSetDefaultAddress';

export { ProfileForm } from './components/ProfileForm';
export { AddressCard } from './components/AddressCard';
export { AddressForm } from './components/AddressForm';
export { AddressMapPicker } from './components/AddressMapPicker';
