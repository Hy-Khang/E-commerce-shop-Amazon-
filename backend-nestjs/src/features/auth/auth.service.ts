import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { IJwtPayload, ILoginResponse, ITokenPair } from './types/auth.types';
import { hashToken } from './utils/auth.util';
import { Role } from './entities/role.entity';
import { User } from './entities/user.entity';
import { IPaginatedResult } from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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

    const tokens = await this.generateTokenPair(
      user.id,
      user.email,
      customerRole.name,
    );
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    this.logger.log(`User registered: ${user.email}`);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: customerRole.name,
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

    const tokens = await this.generateTokenPair(
      user.id,
      user.email,
      user.role.name,
    );
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    this.logger.log(`User logged in: ${user.email}`);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role.name,
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

    const tokens = await this.generateTokenPair(
      user.id,
      user.email,
      user.role.name,
    );
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

  private async generateTokenPair(
    userId: number,
    email: string,
    role: string,
  ): Promise<ITokenPair> {
    const payload: IJwtPayload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
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
