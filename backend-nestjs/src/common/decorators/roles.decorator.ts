import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** @deprecated Use @Permissions() from permissions.decorator.ts instead */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
