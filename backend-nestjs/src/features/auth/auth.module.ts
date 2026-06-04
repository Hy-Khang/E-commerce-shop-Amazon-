import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AdminRoleController } from './admin-role.controller';
import { AdminUserController } from './admin-user.controller';
import { AdminPermissionController } from './admin-permission.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Role } from './entities/role.entity';
import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { RoleRepository } from './repositories/role.repository';
import { UserRepository } from './repositories/user.repository';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { PermissionRepository } from './repositories/permission.repository';
import { RolePermissionRepository } from './repositories/role-permission.repository';
import { InMemoryPermissionCache } from './cache/in-memory-permission.cache';
import { PERMISSION_CACHE_PROVIDER } from './interfaces/permission-cache.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, User, RefreshToken, Permission, RolePermission]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const expiryStr = config.get<string>('jwt.accessExpiry') || '15m';
        const match = expiryStr.match(/^(\d+)([smhd])$/);
        const multipliers: Record<string, number> = {
          s: 1,
          m: 60,
          h: 3600,
          d: 86400,
        };
        const expiresIn = match
          ? parseInt(match[1], 10) * (multipliers[match[2]] || 60)
          : 900;
        return {
          secret: config.get<string>('jwt.accessSecret'),
          signOptions: { expiresIn },
        };
      },
    }),
  ],
  controllers: [AuthController, AdminRoleController, AdminUserController, AdminPermissionController],
  providers: [
    AuthService,
    JwtStrategy,
    RoleRepository,
    UserRepository,
    RefreshTokenRepository,
    PermissionRepository,
    RolePermissionRepository,
    { provide: PERMISSION_CACHE_PROVIDER, useClass: InMemoryPermissionCache },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [AuthService, RolePermissionRepository, PERMISSION_CACHE_PROVIDER],
})
export class AuthModule {}
