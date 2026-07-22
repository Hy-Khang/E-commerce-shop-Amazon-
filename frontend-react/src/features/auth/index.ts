export { useAuthStore } from './stores/auth.store';
export { useLogin } from './hooks/useLogin';
export { useRegister } from './hooks/useRegister';
export { useLogout } from './hooks/useLogout';
export type { AuthUser, AuthMeResponse, LoginRequest, RegisterRequest, LoginResponse } from './types/auth.types';
export { loginSchema, registerSchema } from './types/auth.types';
export { usePermissions } from './hooks/usePermissions';
export { useVerifyEmail } from './hooks/useVerifyEmail';
export { useResendVerification } from './hooks/useResendVerification';
export { useForgotPassword } from './hooks/useForgotPassword';
export { useResetPassword } from './hooks/useResetPassword';
export { useChangePassword } from './hooks/useChangePassword';
export { useSetPassword } from './hooks/useSetPassword';
export { ChangePasswordForm } from './components/ChangePasswordForm';
export { SocialLoginButtons } from './components/SocialLoginButtons';

export { useAdminRoles, useCreateRole, useUpdateRole, useDeleteRole } from './hooks/useAdminRoles';
export {
  useAdminPermissions,
  useRolePermissions,
  useSyncRolePermissions,
  useCreatePermission,
  useUpdatePermission,
  useDeletePermission,
} from './hooks/useAdminPermissions';
export { useAdminUsers } from './hooks/useAdminUsers';
export { useAdminUser } from './hooks/useAdminUser';
export { useToggleActivate } from './hooks/useToggleActivate';
export { useChangeUserRole } from './hooks/useChangeUserRole';
export type {
  Role,
  RoleWithUserCount,
  AdminUser,
  AdminUserDetail,
  AdminUserQueryParams,
  CreateRoleRequest,
  UpdateRoleRequest,
  UpdateUserRoleRequest,
  Permission,
  PermissionsByResource,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  AssignPermissionsRequest,
} from './types/admin.types';
export { createRoleSchema } from './types/admin.types';
