import { DynamicModule, Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { UserAuthProvider } from './entities/user-auth-provider.entity';
import { OAuthCode } from './entities/oauth-code.entity';
import { RoleRepository } from './repositories/role.repository';
import { UserRepository } from './repositories/user.repository';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { PermissionRepository } from './repositories/permission.repository';
import { RolePermissionRepository } from './repositories/role-permission.repository';
import { UserAuthProviderRepository } from './repositories/user-auth-provider.repository';
import { OAuthCodeRepository } from './repositories/oauth-code.repository';
import { InMemoryPermissionCache } from './cache/in-memory-permission.cache';
import { PERMISSION_CACHE_PROVIDER } from './interfaces/permission-cache.interface';
import { MailModule } from '../../core/mail/mail.module';

const logger = new Logger('AuthModule');

@Module({})
export class AuthModule {
  static forRoot(): DynamicModule {
    const oauthProviders: any[] = [];

    if (process.env.GOOGLE_CLIENT_ID) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { GoogleStrategy } = require('./strategies/google.strategy');
      oauthProviders.push(GoogleStrategy);
      logger.log('Google OAuth strategy registered');
    } else {
      logger.log('Google OAuth strategy disabled — missing GOOGLE_CLIENT_ID');
    }

    if (process.env.FACEBOOK_APP_ID) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { FacebookStrategy } = require('./strategies/facebook.strategy');
      oauthProviders.push(FacebookStrategy);
      logger.log('Facebook OAuth strategy registered');
    } else {
      logger.log('Facebook OAuth strategy disabled — missing FACEBOOK_APP_ID');
    }

    return {
      module: AuthModule,
      global: true,
      imports: [
        ConfigModule,
        TypeOrmModule.forFeature([Role, User, RefreshToken, Permission, RolePermission, UserAuthProvider, OAuthCode]),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        MailModule,
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
        ...oauthProviders,
        RoleRepository,
        UserRepository,
        RefreshTokenRepository,
        PermissionRepository,
        RolePermissionRepository,
        UserAuthProviderRepository,
        OAuthCodeRepository,
        { provide: PERMISSION_CACHE_PROVIDER, useClass: InMemoryPermissionCache },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: PermissionsGuard },
      ],
      exports: [AuthService, RolePermissionRepository, PERMISSION_CACHE_PROVIDER],
    };
  }
}
