import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { randomUUID } from 'crypto';
import { UserRepository } from './repositories/user.repository';
import { RoleRepository } from './repositories/role.repository';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { PermissionRepository } from './repositories/permission.repository';
import { RolePermissionRepository } from './repositories/role-permission.repository';
import { UserAuthProviderRepository } from './repositories/user-auth-provider.repository';
import { OAuthCodeRepository } from './repositories/oauth-code.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { IAuthMeResponse, IJwtPayload, ILoginResponse, IOAuthProfile, IRegisterResponse, ITokenPair } from './types/auth.types';
import { MailService } from '../../core/mail/mail.service';
import { hashToken } from './utils/auth.util';
import { Role } from './entities/role.entity';
import { User } from './entities/user.entity';
import { Permission } from './entities/permission.entity';
import { IPaginatedResult } from '../../common/interfaces/paginated-result.interface';
import type { IPermissionCacheProvider } from './interfaces/permission-cache.interface';
import { PERMISSION_CACHE_PROVIDER } from './interfaces/permission-cache.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly permissionRepository: PermissionRepository,
    private readonly rolePermissionRepository: RolePermissionRepository,
    private readonly userAuthProviderRepository: UserAuthProviderRepository,
    private readonly oauthCodeRepository: OAuthCodeRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    @Inject(PERMISSION_CACHE_PROVIDER)
    private readonly permissionCache: IPermissionCacheProvider,
  ) {}

  async register(dto: RegisterDto): Promise<IRegisterResponse> {
    const emailExists = await this.userRepository.existsByEmail(dto.email);
    if (emailExists) {
      throw new ConflictException({
        code: 'USER_001',
        message: 'Email already exists',
      });
    }

    const customerRole = await this.roleRepository.findByName('customer');
    if (!customerRole) {
      throw new Error('Default role "customer" not found. Run database seeds.');
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = hashToken(otp);
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.userRepository.create({
      email: dto.email,
      password_hash: passwordHash,
      full_name: dto.full_name,
      role_id: customerRole.id,
      email_verified: false,
      email_verify_token: otpHash,
      email_verify_expires: otpExpires,
      email_verify_count: 1,
      email_verify_count_reset: new Date(),
    });

    try {
      await this.mailService.sendVerificationEmail(dto.email, dto.full_name, otp);
    } catch {
      user.email_verify_token = null;
      user.email_verify_expires = null;
      user.email_verify_count = 0;
      await this.userRepository.save(user);
      throw new InternalServerErrorException({
        code: 'AUTH_012',
        message: 'Account created but failed to send verification email. Please use resend.',
      });
    }

    this.logger.log(`User registered: ${dto.email}`);

    return {
      email: dto.email,
      expiresIn: 300,
      message: 'Verification code sent to your email',
    };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<ILoginResponse> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new BadRequestException({
        code: 'AUTH_007',
        message: 'Invalid verification code',
      });
    }

    if (user.email_verified) {
      throw new BadRequestException({
        code: 'AUTH_007',
        message: 'Email already verified',
      });
    }

    if (user.email_verify_attempts >= 5) {
      throw new BadRequestException({
        code: 'AUTH_013',
        message: 'Too many verification attempts. Please request a new code.',
      });
    }

    if (!user.email_verify_expires || user.email_verify_expires < new Date()) {
      throw new BadRequestException({
        code: 'AUTH_012',
        message: 'Verification code expired',
      });
    }

    const incomingHash = hashToken(dto.otp);
    const storedHash = user.email_verify_token || '';

    const isMatch =
      incomingHash.length === storedHash.length &&
      crypto.timingSafeEqual(Buffer.from(incomingHash), Buffer.from(storedHash));

    if (!isMatch) {
      user.email_verify_attempts += 1;
      await this.userRepository.save(user);
      throw new BadRequestException({
        code: 'AUTH_007',
        message: 'Invalid verification code',
      });
    }

    user.email_verified = true;
    user.email_verify_token = null;
    user.email_verify_expires = null;
    user.email_verify_attempts = 0;
    await this.userRepository.save(user);

    return this.buildLoginResponse(user);
  }

  async resendVerification(dto: ResendVerificationDto): Promise<IRegisterResponse> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user || user.email_verified) {
      return {
        email: dto.email,
        expiresIn: 300,
        message: 'If the email exists and is unverified, a new code has been sent',
      };
    }

    // 60s cooldown: OTP was sent less than 60s ago
    if (user.email_verify_expires) {
      const sentAt = new Date(user.email_verify_expires.getTime() - 5 * 60 * 1000);
      if (Date.now() - sentAt.getTime() < 60 * 1000) {
        throw new BadRequestException({
          code: 'AUTH_011',
          message: 'Please wait before requesting a new code',
        });
      }
    }

    // Hourly limit: max 5 per hour
    const now = new Date();
    if (user.email_verify_count_reset) {
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      if (user.email_verify_count_reset > hourAgo) {
        if (user.email_verify_count >= 5) {
          throw new BadRequestException({
            code: 'AUTH_011',
            message: 'Too many requests. Please try again later.',
          });
        }
      } else {
        user.email_verify_count = 0;
        user.email_verify_count_reset = now;
      }
    } else {
      user.email_verify_count_reset = now;
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    user.email_verify_token = hashToken(otp);
    user.email_verify_expires = new Date(Date.now() + 5 * 60 * 1000);
    user.email_verify_count += 1;
    user.email_verify_attempts = 0;
    await this.userRepository.save(user);

    await this.mailService.sendVerificationEmail(dto.email, user.full_name, otp);

    return {
      email: dto.email,
      expiresIn: 300,
      message: 'Verification code sent to your email',
    };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user || !user.is_active) {
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const rawToken = crypto.randomBytes(32).toString('base64url');
    user.password_reset_token_hash = hashToken(rawToken);
    user.password_reset_expires_at = new Date(Date.now() + 60 * 60 * 1000);
    await this.userRepository.save(user);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

    await this.mailService.sendPasswordResetEmail(dto.email, user.full_name, resetUrl);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = hashToken(dto.token);
    const user = await this.userRepository.findByPasswordResetTokenHash(tokenHash);

    if (!user) {
      throw new BadRequestException({
        code: 'AUTH_008',
        message: 'Invalid or already-used reset token',
      });
    }

    if (!user.password_reset_expires_at || user.password_reset_expires_at < new Date()) {
      throw new BadRequestException({
        code: 'AUTH_012',
        message: 'Reset token expired',
      });
    }

    user.password_hash = await bcrypt.hash(dto.password, 10);
    user.password_reset_token_hash = null;
    user.password_reset_expires_at = null;
    await this.userRepository.save(user);

    await this.refreshTokenRepository.revokeAllByUserId(user.id);

    return { message: 'Password reset successfully' };
  }

  async changePassword(userId: number, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException({ code: 'USER_002', message: 'User not found' });
    }

    if (!user.password_hash) {
      throw new BadRequestException({
        code: 'AUTH_001',
        message: 'Use set-password endpoint for OAuth accounts',
      });
    }

    const isValid = await bcrypt.compare(dto.current_password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedException({
        code: 'AUTH_001',
        message: 'Current password is incorrect',
      });
    }

    const isSame = await bcrypt.compare(dto.new_password, user.password_hash);
    if (isSame) {
      throw new BadRequestException({
        code: 'AUTH_010',
        message: 'New password must differ from current password',
      });
    }

    user.password_hash = await bcrypt.hash(dto.new_password, 10);
    await this.userRepository.save(user);
    await this.refreshTokenRepository.revokeAllByUserId(userId);

    return { message: 'Password changed successfully' };
  }

  async setPassword(userId: number, dto: SetPasswordDto): Promise<{ message: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException({ code: 'USER_002', message: 'User not found' });
    }

    if (user.password_hash) {
      throw new BadRequestException({
        code: 'AUTH_001',
        message: 'Use change-password endpoint for accounts with existing password',
      });
    }

    user.password_hash = await bcrypt.hash(dto.new_password, 10);
    await this.userRepository.save(user);
    await this.refreshTokenRepository.revokeAllByUserId(userId);

    return { message: 'Password set successfully' };
  }

  async oauthLogin(profile: IOAuthProfile): Promise<User> {
    if (!profile.email) {
      throw new BadRequestException({
        code: 'AUTH_014',
        message: 'OAuth provider did not return an email address',
      });
    }

    const existingLink = await this.userAuthProviderRepository.findByProviderAndProviderId(
      profile.provider,
      profile.providerId,
    );

    if (existingLink) {
      const user = existingLink.user;
      if (!user.is_active) {
        throw new ForbiddenException({ code: 'AUTH_005', message: 'Account deactivated' });
      }
      return user;
    }

    const existingUser = await this.userRepository.findByEmail(profile.email);

    if (existingUser) {
      if (!existingUser.is_active) {
        throw new ForbiddenException({ code: 'AUTH_005', message: 'Account deactivated' });
      }
      if (!existingUser.email_verified) {
        existingUser.email_verified = true;
        await this.userRepository.save(existingUser);
      }
      await this.userAuthProviderRepository.linkProvider(existingUser.id, profile.provider, profile.providerId);
      this.logger.log(`Linked ${profile.provider} to existing user: ${existingUser.email}`);
      return existingUser;
    }

    const customerRole = await this.roleRepository.findByName('customer');
    if (!customerRole) {
      throw new Error('Default role "customer" not found. Run database seeds.');
    }

    const newUser = await this.userRepository.create({
      email: profile.email,
      password_hash: null as any,
      full_name: profile.fullName,
      role_id: customerRole.id,
      email_verified: true,
    });

    await this.userAuthProviderRepository.linkProvider(newUser.id, profile.provider, profile.providerId);
    this.logger.log(`OAuth user created: ${profile.email} via ${profile.provider}`);

    const userWithRole = await this.userRepository.findById(newUser.id);
    return userWithRole!;
  }

  async generateOAuthCode(userId: number): Promise<string> {
    const rawCode = crypto.randomBytes(32).toString('base64url');
    const codeHash = hashToken(rawCode);
    const expiresAt = new Date(Date.now() + 60 * 1000);
    await this.oauthCodeRepository.createCode(codeHash, userId, expiresAt);
    return rawCode;
  }

  async exchangeOAuthCode(code: string): Promise<ILoginResponse> {
    const codeHash = hashToken(code);
    const oauthCode = await this.oauthCodeRepository.findAndDeleteByCodeHash(codeHash);

    if (!oauthCode) {
      throw new BadRequestException({
        code: 'AUTH_009',
        message: 'Invalid or expired OAuth code',
      });
    }

    if (oauthCode.expires_at < new Date()) {
      throw new BadRequestException({
        code: 'AUTH_009',
        message: 'OAuth code expired',
      });
    }

    const user = await this.userRepository.findById(oauthCode.user_id);
    if (!user) {
      throw new BadRequestException({
        code: 'AUTH_009',
        message: 'Invalid OAuth code',
      });
    }

    return this.buildLoginResponse(user);
  }

  async login(dto: LoginDto): Promise<ILoginResponse> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException({
        code: 'AUTH_001',
        message: 'Invalid credentials',
      });
    }

    if (!user.is_active) {
      throw new ForbiddenException({
        code: 'AUTH_005',
        message: 'Account deactivated',
      });
    }

    if (!user.password_hash) {
      throw new UnauthorizedException({
        code: 'AUTH_001',
        message: 'Invalid credentials',
      });
    }

    if (!user.email_verified) {
      throw new UnauthorizedException({
        code: 'AUTH_006',
        message: 'Email not verified',
        email: user.email,
      } as any);
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!passwordValid) {
      throw new UnauthorizedException({
        code: 'AUTH_001',
        message: 'Invalid credentials',
      });
    }

    return this.buildLoginResponse(user);
  }

  private async buildLoginResponse(user: User): Promise<ILoginResponse> {
    const tokens = await this.generateTokenPair(user.id, user.role_id);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    const permissions = await this.rolePermissionRepository.findPermissionStringsByRoleId(user.role_id);
    const providers = await this.userAuthProviderRepository.getProviderNamesByUserId(user.id);

    this.logger.log(`User logged in: ${user.email}`);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role.name,
        role_id: user.role_id,
        permissions,
        email_verified: user.email_verified,
        has_password: user.password_hash !== null,
        providers,
      },
    };
  }

  async refresh(refreshToken: string): Promise<ITokenPair> {
    const tokenHash = hashToken(refreshToken);
    const storedToken =
      await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (!storedToken || storedToken.expires_at < new Date()) {
      throw new UnauthorizedException({
        code: 'AUTH_003',
        message: 'Refresh token expired or revoked',
      });
    }

    const user = await this.userRepository.findById(storedToken.user_id);
    if (!user || !user.is_active) {
      throw new ForbiddenException({
        code: 'AUTH_005',
        message: 'Account deactivated',
      });
    }

    await this.refreshTokenRepository.revokeByTokenHash(tokenHash);

    const tokens = await this.generateTokenPair(user.id, user.role_id);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    await this.refreshTokenRepository.revokeByTokenHash(tokenHash);
  }

  async logoutAll(userId: number): Promise<void> {
    await this.refreshTokenRepository.revokeAllByUserId(userId);
    this.logger.log(`All tokens revoked for user ${userId}`);
  }

  async getMe(userId: number): Promise<IAuthMeResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException({
        code: 'AUTH_002',
        message: 'Authentication required',
      });
    }

    const permissions = await this.rolePermissionRepository.findPermissionStringsByRoleId(user.role_id);
    const providers = await this.userAuthProviderRepository.getProviderNamesByUserId(user.id);

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role.name,
      role_id: user.role_id,
      permissions,
      is_active: user.is_active,
      email_verified: user.email_verified,
      has_password: user.password_hash !== null,
      providers,
    };
  }

  // ─── Admin: User Management ───

  async findAllUsers(query: AdminUserQueryDto): Promise<IPaginatedResult<User>> {
    return this.userRepository.findAllPaginated(query);
  }

  async findUserById(id: number): Promise<User & { orderCount: number; reviewCount: number }> {
    const user = await this.userRepository.findByIdWithStats(id);
    if (!user) {
      throw new NotFoundException({
        code: 'USER_002',
        message: 'User not found',
      });
    }
    return user;
  }

  async toggleActivate(id: number): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException({
        code: 'USER_002',
        message: 'User not found',
      });
    }

    const newStatus = !user.is_active;
    await this.userRepository.updateIsActive(id, newStatus);
    this.logger.log(`User ${id} ${newStatus ? 'activated' : 'deactivated'}`);

    return { ...user, is_active: newStatus };
  }

  async changeUserRole(id: number, dto: UpdateUserRoleDto): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException({
        code: 'USER_002',
        message: 'User not found',
      });
    }

    const role = await this.roleRepository.findById(dto.role_id);
    if (!role) {
      throw new NotFoundException({
        code: 'COMMON_001',
        message: 'Role not found',
      });
    }

    await this.userRepository.updateRoleId(id, dto.role_id);
    this.logger.log(`User ${id} role changed to ${role.name}`);

    return { ...user, role_id: dto.role_id, role };
  }

  async updateProfile(userId: number, data: { full_name?: string; phone?: string }): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException({
        code: 'USER_002',
        message: 'User not found',
      });
    }

    const updated = await this.userRepository.updateProfile(userId, data);
    return updated!;
  }

  // ─── Admin: Role Management ───

  async findAllRoles(): Promise<(Role & { userCount: number })[]> {
    return this.roleRepository.findAllWithUserCount();
  }

  async findRoleById(id: number): Promise<Role & { userCount: number }> {
    const role = await this.roleRepository.findByIdWithUserCount(id);
    if (!role) {
      throw new NotFoundException({
        code: 'COMMON_001',
        message: 'Role not found',
      });
    }
    return role;
  }

  async createRole(dto: CreateRoleDto): Promise<Role> {
    const exists = await this.roleRepository.existsByName(dto.name);
    if (exists) {
      throw new ConflictException({
        code: 'ROLE_001',
        message: `Role "${dto.name}" already exists`,
      });
    }
    const role = await this.roleRepository.create({ name: dto.name });
    this.logger.log(`Role created: ${role.name}`);
    return role;
  }

  async updateRole(id: number, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new NotFoundException({
        code: 'COMMON_001',
        message: 'Role not found',
      });
    }

    if (dto.name && dto.name !== role.name) {
      const exists = await this.roleRepository.existsByName(dto.name);
      if (exists) {
        throw new ConflictException({
          code: 'ROLE_001',
          message: `Role "${dto.name}" already exists`,
        });
      }
    }

    const updated = await this.roleRepository.update(id, dto);
    this.logger.log(`Role updated: ${id}`);
    return updated!;
  }

  async deleteRole(id: number): Promise<void> {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new NotFoundException({
        code: 'COMMON_001',
        message: 'Role not found',
      });
    }

    if (role.is_system) {
      throw new BadRequestException({
        code: 'PERMISSION_006',
        message: 'Cannot delete system role',
      });
    }

    const hasUsers = await this.roleRepository.hasUsers(id);
    if (hasUsers) {
      throw new BadRequestException({
        code: 'ROLE_002',
        message: 'Cannot delete role with assigned users',
      });
    }

    await this.roleRepository.delete(id);
    this.logger.log(`Role deleted: ${role.name}`);
  }

  // ─── Admin: Permission Management ───

  async findAllPermissions(resource?: string): Promise<Permission[]> {
    if (resource) {
      return this.permissionRepository.findByResource(resource);
    }
    return this.permissionRepository.findAll();
  }

  async findPermissionById(id: number): Promise<Permission> {
    const permission = await this.permissionRepository.findById(id);
    if (!permission) {
      throw new NotFoundException({
        code: 'PERMISSION_003',
        message: 'Permission not found',
      });
    }
    return permission;
  }

  async createPermission(dto: CreatePermissionDto): Promise<Permission> {
    const exists = await this.permissionRepository.findByResourceAndAction(
      dto.resource,
      dto.action,
    );
    if (exists) {
      throw new ConflictException({
        code: 'PERMISSION_001',
        message: `Permission ${dto.resource}:${dto.action} already exists`,
      });
    }

    const permission = await this.permissionRepository.create(dto);
    this.logger.log(`Permission created: ${dto.resource}:${dto.action}`);
    return permission;
  }

  async updatePermission(id: number, dto: UpdatePermissionDto): Promise<Permission> {
    const permission = await this.permissionRepository.findById(id);
    if (!permission) {
      throw new NotFoundException({
        code: 'PERMISSION_003',
        message: 'Permission not found',
      });
    }

    const updated = await this.permissionRepository.update(id, dto);
    await this.permissionCache.invalidateAll();
    this.logger.log(`Permission updated: ${id}`);
    return updated!;
  }

  async deletePermission(id: number): Promise<void> {
    const permission = await this.permissionRepository.findById(id);
    if (!permission) {
      throw new NotFoundException({
        code: 'PERMISSION_003',
        message: 'Permission not found',
      });
    }

    const assigned = await this.permissionRepository.isAssignedToRoles(id);
    if (assigned) {
      throw new BadRequestException({
        code: 'PERMISSION_002',
        message: 'Cannot delete permission assigned to roles',
      });
    }

    await this.permissionRepository.delete(id);
    await this.permissionCache.invalidateAll();
    this.logger.log(`Permission deleted: ${permission.resource}:${permission.action}`);
  }

  // ─── Admin: Role-Permission Assignment ───

  async getRolePermissions(roleId: number): Promise<Permission[]> {
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundException({
        code: 'COMMON_001',
        message: 'Role not found',
      });
    }

    const rolePermissions = await this.rolePermissionRepository.findByRoleId(roleId);
    return rolePermissions.map((rp) => rp.permission);
  }

  async syncRolePermissions(
    roleId: number,
    dto: AssignPermissionsDto,
    currentUserRoleId: number,
  ): Promise<Permission[]> {
    this.validateRolePermissionModification(roleId, currentUserRoleId);

    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundException({
        code: 'COMMON_001',
        message: 'Role not found',
      });
    }

    await this.validateEscalation(dto.permission_ids, currentUserRoleId);

    await this.rolePermissionRepository.syncPermissions(roleId, dto.permission_ids);
    await this.permissionCache.invalidate(roleId);
    this.logger.log(`Role ${roleId} permissions synced: [${dto.permission_ids.join(', ')}]`);

    return this.getRolePermissions(roleId);
  }

  async addRolePermissions(
    roleId: number,
    dto: AssignPermissionsDto,
    currentUserRoleId: number,
  ): Promise<Permission[]> {
    this.validateRolePermissionModification(roleId, currentUserRoleId);

    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundException({
        code: 'COMMON_001',
        message: 'Role not found',
      });
    }

    await this.validateEscalation(dto.permission_ids, currentUserRoleId);

    await this.rolePermissionRepository.addPermissions(roleId, dto.permission_ids);
    await this.permissionCache.invalidate(roleId);
    this.logger.log(`Role ${roleId} permissions added: [${dto.permission_ids.join(', ')}]`);

    return this.getRolePermissions(roleId);
  }

  async removeRolePermissions(
    roleId: number,
    dto: AssignPermissionsDto,
    currentUserRoleId: number,
  ): Promise<Permission[]> {
    this.validateRolePermissionModification(roleId, currentUserRoleId);

    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundException({
        code: 'COMMON_001',
        message: 'Role not found',
      });
    }

    await this.rolePermissionRepository.removePermissions(roleId, dto.permission_ids);
    await this.permissionCache.invalidate(roleId);
    this.logger.log(`Role ${roleId} permissions removed: [${dto.permission_ids.join(', ')}]`);

    return this.getRolePermissions(roleId);
  }

  private validateRolePermissionModification(targetRoleId: number, currentUserRoleId: number): void {
    if (targetRoleId === currentUserRoleId) {
      throw new ForbiddenException({
        code: 'PERMISSION_005',
        message: 'Cannot modify own role\'s permissions',
      });
    }
  }

  private async validateEscalation(permissionIds: number[], currentUserRoleId: number): Promise<void> {
    const currentUserPermissions = await this.rolePermissionRepository.findByRoleId(currentUserRoleId);
    const currentPermissionIds = new Set(currentUserPermissions.map((rp) => rp.permission_id));

    const unauthorized = permissionIds.filter((id) => !currentPermissionIds.has(id));
    if (unauthorized.length > 0) {
      throw new ForbiddenException({
        code: 'PERMISSION_004',
        message: 'Cannot grant permissions you do not possess',
      });
    }
  }

  private async generateTokenPair(
    userId: number,
    roleId: number,
  ): Promise<ITokenPair> {
    const payload: IJwtPayload = { sub: userId, roleId };

    const accessToken = this.jwtService.sign({
      sub: payload.sub,
      roleId: payload.roleId,
    });

    const refreshToken = randomUUID();

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(
    userId: number,
    rawToken: string,
  ): Promise<void> {
    const refreshExpiry = this.configService.get<string>(
      'jwt.refreshExpiry',
      '7d',
    );
    const days = parseInt(refreshExpiry, 10) || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    await this.refreshTokenRepository.create({
      user_id: userId,
      token_hash: hashToken(rawToken),
      expires_at: expiresAt,
    });
  }
}
