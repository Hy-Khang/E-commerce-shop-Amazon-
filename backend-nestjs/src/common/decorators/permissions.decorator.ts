import { SetMetadata } from '@nestjs/common';
import { PermissionString } from '../constants/permissions.constant';

export const PERMISSIONS_KEY = 'permissions';

export interface PermissionsMetadata {
  mode: 'all' | 'any';
  permissions: PermissionString[];
}

export const Permissions = (...permissions: PermissionString[]) =>
  SetMetadata(PERMISSIONS_KEY, { mode: 'all', permissions } as PermissionsMetadata);
