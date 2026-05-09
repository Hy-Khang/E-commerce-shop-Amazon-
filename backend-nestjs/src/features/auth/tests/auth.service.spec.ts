import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UserRepository } from '../repositories/user.repository';
import { RoleRepository } from '../repositories/role.repository';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<UserRepository>;
  let roleRepository: jest.Mocked<RoleRepository>;
  let refreshTokenRepository: jest.Mocked<RefreshTokenRepository>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            existsByEmail: jest.fn(),
          },
        },
        {
          provide: RoleRepository,
          useValue: { findByName: jest.fn() },
        },
        {
          provide: RefreshTokenRepository,
          useValue: {
            findByTokenHash: jest.fn(),
            create: jest.fn(),
            revokeByTokenHash: jest.fn(),
            revokeAllByUserId: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('signed-token') },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                'jwt.accessSecret': 'test-secret',
                'jwt.accessExpiry': '15m',
                'jwt.refreshExpiry': '7d',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(UserRepository);
    roleRepository = module.get(RoleRepository);
    refreshTokenRepository = module.get(RefreshTokenRepository);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const dto = {
      email: 'test@example.com',
      password: 'password123',
      full_name: 'Test User',
    };

    it('should register a new user and return tokens', async () => {
      // Arrange
      userRepository.existsByEmail.mockResolvedValue(false);
      roleRepository.findByName.mockResolvedValue({ id: 1, name: 'customer', users: [] });
      userRepository.create.mockResolvedValue({
        id: 1,
        email: dto.email,
        full_name: dto.full_name,
        role_id: 1,
      } as any);
      refreshTokenRepository.create.mockResolvedValue({} as any);

      // Act
      const result = await service.register(dto);

      // Assert
      expect(result.user.email).toBe(dto.email);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw ConflictException if email exists', async () => {
      // Arrange
      userRepository.existsByEmail.mockResolvedValue(true);

      // Act & Assert
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const dto = { email: 'test@example.com', password: 'password123' };

    it('should throw UnauthorizedException for non-existent user', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException for deactivated user', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue({
        id: 1,
        email: dto.email,
        is_active: false,
        role: { name: 'customer' },
      } as any);

      // Act & Assert
      await expect(service.login(dto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('refresh', () => {
    it('should throw UnauthorizedException for invalid token', async () => {
      // Arrange
      refreshTokenRepository.findByTokenHash.mockResolvedValue(null);

      // Act & Assert
      await expect(service.refresh('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logoutAll', () => {
    it('should revoke all tokens for user', async () => {
      // Arrange
      refreshTokenRepository.revokeAllByUserId.mockResolvedValue(undefined);

      // Act
      await service.logoutAll(1);

      // Assert
      expect(refreshTokenRepository.revokeAllByUserId).toHaveBeenCalledWith(1);
    });
  });
});
