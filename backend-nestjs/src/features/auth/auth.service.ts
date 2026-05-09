import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
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
import { IJwtPayload, ILoginResponse, ITokenPair } from './types/auth.types';
import { hashToken } from './utils/auth.util';

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
