import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, PermissionsMetadata } from '../decorators/permissions.decorator';
import { ICurrentUser } from '../interfaces/current-user.interface';
import type { IPermissionCacheProvider } from '../../features/auth/interfaces/permission-cache.interface';
import { PERMISSION_CACHE_PROVIDER } from '../../features/auth/interfaces/permission-cache.interface';
import { RolePermissionRepository } from '../../features/auth/repositories/role-permission.repository';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(PERMISSION_CACHE_PROVIDER)
    private readonly permissionCache: IPermissionCacheProvider,
    private readonly rolePermissionRepository: RolePermissionRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.getAllAndOverride<PermissionsMetadata>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!metadata) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as ICurrentUser | undefined;

    if (!user) {
      throw new UnauthorizedException({
        code: 'AUTH_002',
        message: 'Authentication required',
      });
    }

    let userPermissions = await this.permissionCache.get(user.roleId);

    if (!userPermissions) {
      const permStrings = await this.rolePermissionRepository.findPermissionStringsByRoleId(user.roleId);
      userPermissions = new Set(permStrings);
      await this.permissionCache.set(user.roleId, userPermissions);
    }

    const { mode, permissions: required } = metadata;

    const hasPermission =
      mode === 'any'
        ? required.some((p) => userPermissions!.has(p))
        : required.every((p) => userPermissions!.has(p));

    if (!hasPermission) {
      throw new ForbiddenException({
        code: 'AUTH_004',
        message: 'Insufficient permissions',
      });
    }

    return true;
  }
}
