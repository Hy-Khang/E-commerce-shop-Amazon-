import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { UserRepository } from './repositories/user.repository';
import { RoleRepository } from './repositories/role.repository';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { PermissionRepository } from './repositories/permission.repository';
import { RolePermissionRepository } from './repositories/role-permission.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { IAuthMeResponse, IJwtPayload, ILoginResponse, ITokenPair } from './types/auth.types';
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
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(PERMISSION_CACHE_PROVIDER)
    private readonly permissionCache: IPermissionCacheProvider,
  ) {}

  async register(dto: RegisterDto): Promise<ILoginResponse> {
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

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.userRepository.create({
      email: dto.email,
      password_hash: passwordHash,
      full_name: dto.full_name,
      role_id: customerRole.id,
    });

    const tokens = await this.generateTokenPair(user.id, customerRole.id);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    const permissions = await this.rolePermissionRepository.findPermissionStringsByRoleId(customerRole.id);

    this.logger.log(`User registered: ${user.email}`);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: customerRole.name,
        role_id: customerRole.id,
        permissions,
      },
    };
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

    const passwordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!passwordValid) {
      throw new UnauthorizedException({
        code: 'AUTH_001',
        message: 'Invalid credentials',
      });
    }

    const tokens = await this.generateTokenPair(user.id, user.role_id);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    const permissions = await this.rolePermissionRepository.findPermissionStringsByRoleId(user.role_id);

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

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role.name,
      role_id: user.role_id,
      permissions,
      is_active: user.is_active,
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
