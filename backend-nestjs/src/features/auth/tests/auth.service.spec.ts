import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { UserRepository } from '../repositories/user.repository';
import { RoleRepository } from '../repositories/role.repository';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { PermissionRepository } from '../repositories/permission.repository';
import { RolePermissionRepository } from '../repositories/role-permission.repository';
import { UserAuthProviderRepository } from '../repositories/user-auth-provider.repository';
import { OAuthCodeRepository } from '../repositories/oauth-code.repository';
import { PERMISSION_CACHE_PROVIDER } from '../interfaces/permission-cache.interface';
import { MailService } from '../../../core/mail/mail.service';
import {
  mockRole,
  mockAdminRole,
  mockUser,
  mockUserWithStats,
  mockRoleWithUserCount,
  mockRefreshToken,
} from './mocks/auth.mock';

jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

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
            findAllPaginated: jest.fn(),
            findByIdWithStats: jest.fn(),
            updateIsActive: jest.fn(),
            updateRoleId: jest.fn(),
            updateProfile: jest.fn(),
            save: jest.fn(),
            findByPasswordResetTokenHash: jest.fn(),
          },
        },
        {
          provide: RoleRepository,
          useValue: {
            findByName: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            findAllWithUserCount: jest.fn(),
            findByIdWithUserCount: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            existsByName: jest.fn(),
            hasUsers: jest.fn(),
          },
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
          provide: PermissionRepository,
          useValue: {
            findAll: jest.fn(),
            findByResource: jest.fn(),
            findById: jest.fn(),
            findByIds: jest.fn(),
            findByResourceAndAction: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            isAssignedToRoles: jest.fn(),
          },
        },
        {
          provide: RolePermissionRepository,
          useValue: {
            findByRoleId: jest.fn(),
            findPermissionStringsByRoleId: jest.fn().mockResolvedValue([]),
            syncPermissions: jest.fn(),
            addPermissions: jest.fn(),
            removePermissions: jest.fn(),
          },
        },
        {
          provide: UserAuthProviderRepository,
          useValue: {
            findByProviderAndProviderId: jest.fn(),
            findByUserId: jest.fn(),
            getProviderNamesByUserId: jest.fn().mockResolvedValue([]),
            linkProvider: jest.fn(),
            hasProvider: jest.fn(),
          },
        },
        {
          provide: OAuthCodeRepository,
          useValue: {
            createCode: jest.fn(),
            findAndDeleteByCodeHash: jest.fn(),
            cleanupExpired: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
            sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: PERMISSION_CACHE_PROVIDER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            invalidate: jest.fn(),
            invalidateAll: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('signed-access-token') },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              const config: Record<string, string> = {
                'jwt.accessSecret': 'test-secret',
                'jwt.accessExpiry': '15m',
                'jwt.refreshExpiry': '7d',
              };
              return config[key] ?? defaultValue;
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═══════════════════════════════════════════
  // Auth: register
  // ═══════════════════════════════════════════

  describe('register', () => {
    const dto = {
      email: 'newuser@example.com',
      password: 'securePassword123',
      full_name: 'Nguyen Van A',
    };

    it('should register a new user and return verification info', async () => {
      // Arrange
      userRepository.existsByEmail.mockResolvedValue(false);
      roleRepository.findByName.mockResolvedValue(mockRole());
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedpassword');
      const createdUser = mockUser({ id: 1, email: dto.email, full_name: dto.full_name });
      userRepository.create.mockResolvedValue(createdUser);
      userRepository.save.mockResolvedValue(createdUser);

      // Act
      const result = await service.register(dto);

      // Assert
      expect(result.email).toBe(dto.email);
      expect(result.expiresIn).toBe(300);
      expect(result.message).toBeDefined();
    });

    it('should hash the password with bcrypt before storing', async () => {
      // Arrange
      userRepository.existsByEmail.mockResolvedValue(false);
      roleRepository.findByName.mockResolvedValue(mockRole());
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashed');
      const createdUser = mockUser({ email: dto.email });
      userRepository.create.mockResolvedValue(createdUser);
      userRepository.save.mockResolvedValue(createdUser);

      // Act
      await service.register(dto);

      // Assert
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ password_hash: '$2b$10$hashed' }),
      );
    });

    it('should send verification email after registration', async () => {
      // Arrange
      userRepository.existsByEmail.mockResolvedValue(false);
      roleRepository.findByName.mockResolvedValue(mockRole());
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashed');
      const createdUser = mockUser({ id: 42, email: dto.email });
      userRepository.create.mockResolvedValue(createdUser);
      userRepository.save.mockResolvedValue(createdUser);
      const mailService = (service as any).mailService as jest.Mocked<MailService>;

      // Act
      await service.register(dto);

      // Assert
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        dto.email,
        dto.full_name,
        expect.any(String),
      );
    });

    it('should assign customer role to new user', async () => {
      // Arrange
      const customerRole = mockRole({ id: 5, name: 'customer' });
      userRepository.existsByEmail.mockResolvedValue(false);
      roleRepository.findByName.mockResolvedValue(customerRole);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashed');
      const createdUser = mockUser({ email: dto.email });
      userRepository.create.mockResolvedValue(createdUser);
      userRepository.save.mockResolvedValue(createdUser);

      // Act
      await service.register(dto);

      // Assert
      expect(roleRepository.findByName).toHaveBeenCalledWith('customer');
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ role_id: 5 }),
      );
    });

    it('should throw ConflictException (USER_001) if email already exists', async () => {
      // Arrange
      userRepository.existsByEmail.mockResolvedValue(true);

      // Act & Assert
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('should include USER_001 error code in ConflictException', async () => {
      // Arrange
      userRepository.existsByEmail.mockResolvedValue(true);

      // Act & Assert
      try {
        await service.register(dto);
        fail('Should have thrown');
      } catch (e: any) {
        expect(e.getResponse()).toEqual(
          expect.objectContaining({ code: 'USER_001' }),
        );
      }
    });

    it('should throw Error if default customer role not found in database', async () => {
      // Arrange
      userRepository.existsByEmail.mockResolvedValue(false);
      roleRepository.findByName.mockResolvedValue(null);

      // Act & Assert
      await expect(service.register(dto)).rejects.toThrow(
        'Default role "customer" not found. Run database seeds.',
      );
    });

    it('should not generate JWT tokens during registration', async () => {
      // Arrange
      userRepository.existsByEmail.mockResolvedValue(false);
      roleRepository.findByName.mockResolvedValue(mockRole());
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashed');
      const createdUser = mockUser({ id: 7, email: dto.email });
      userRepository.create.mockResolvedValue(createdUser);
      userRepository.save.mockResolvedValue(createdUser);

      // Act
      await service.register(dto);

      // Assert — register no longer generates tokens (verify-email does)
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════
  // Auth: login
  // ═══════════════════════════════════════════

  describe('login', () => {
    const dto = { email: 'test@example.com', password: 'password123' };

    it('should login successfully and return tokens + user info', async () => {
      // Arrange
      const user = mockUser({ id: 1, email: dto.email, full_name: 'Nguyen Van A' });
      userRepository.findByEmail.mockResolvedValue(user);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
      refreshTokenRepository.create.mockResolvedValue({} as any);

      // Act
      const result = await service.login(dto);

      // Assert
      expect(result.accessToken).toBe('signed-access-token');
      expect(result.refreshToken).toBeDefined();
      expect(result.user).toEqual(
        expect.objectContaining({
          id: 1,
          email: dto.email,
          full_name: 'Nguyen Van A',
          role: 'customer',
          role_id: 1,
          permissions: [],
          email_verified: true,
          has_password: true,
          providers: [],
        }),
      );
    });

    it('should store refresh token after login', async () => {
      // Arrange
      const user = mockUser({ id: 10, email: dto.email });
      userRepository.findByEmail.mockResolvedValue(user);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
      refreshTokenRepository.create.mockResolvedValue({} as any);

      // Act
      await service.login(dto);

      // Assert
      expect(refreshTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 10,
          token_hash: expect.any(String),
          expires_at: expect.any(Date),
        }),
      );
    });

    it('should generate JWT with user id and roleId', async () => {
      // Arrange
      const user = mockUser({ id: 3, email: dto.email, role_id: 2, role: mockAdminRole() });
      userRepository.findByEmail.mockResolvedValue(user);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
      refreshTokenRepository.create.mockResolvedValue({} as any);

      // Act
      await service.login(dto);

      // Assert
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 3,
        roleId: 2,
      });
    });

    it('should throw UnauthorizedException (AUTH_001) for non-existent user', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should include AUTH_001 error code when user not found', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      try {
        await service.login(dto);
        fail('Should have thrown');
      } catch (e: any) {
        expect(e.getResponse()).toEqual(
          expect.objectContaining({ code: 'AUTH_001' }),
        );
      }
    });

    it('should throw ForbiddenException (AUTH_005) for deactivated user', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(mockUser({ is_active: false }));

      // Act & Assert
      await expect(service.login(dto)).rejects.toThrow(ForbiddenException);
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should include AUTH_005 error code for deactivated account', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(mockUser({ is_active: false }));

      // Act & Assert
      try {
        await service.login(dto);
        fail('Should have thrown');
      } catch (e: any) {
        expect(e.getResponse()).toEqual(
          expect.objectContaining({ code: 'AUTH_005' }),
        );
      }
    });

    it('should throw UnauthorizedException (AUTH_001) for wrong password', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(mockUser({ email: dto.email }));
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      expect(refreshTokenRepository.create).not.toHaveBeenCalled();
    });

    it('should return same AUTH_001 code for wrong password as for missing user', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(mockUser({ email: dto.email }));
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      try {
        await service.login(dto);
        fail('Should have thrown');
      } catch (e: any) {
        expect(e.getResponse()).toEqual(
          expect.objectContaining({ code: 'AUTH_001' }),
        );
      }
    });

    it('should check is_active before comparing password', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(mockUser({ is_active: false }));

      // Act
      try {
        await service.login(dto);
      } catch {
        // expected
      }

      // Assert — bcrypt.compare should never be called for inactive users
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════
  // Auth: refresh
  // ═══════════════════════════════════════════

  describe('refresh', () => {
    const rawToken = 'valid-refresh-token-uuid';

    it('should issue new token pair and revoke old token', async () => {
      // Arrange
      const storedToken = mockRefreshToken({
        user_id: 1,
        expires_at: new Date(Date.now() + 86400000),
      });
      const user = mockUser({ id: 1, is_active: true });
      refreshTokenRepository.findByTokenHash.mockResolvedValue(storedToken);
      userRepository.findById.mockResolvedValue(user);
      refreshTokenRepository.revokeByTokenHash.mockResolvedValue(undefined);
      refreshTokenRepository.create.mockResolvedValue({} as any);

      // Act
      const result = await service.refresh(rawToken);

      // Assert
      expect(result.accessToken).toBe('signed-access-token');
      expect(result.refreshToken).toBeDefined();
    });

    it('should revoke old token before issuing new pair', async () => {
      // Arrange
      const storedToken = mockRefreshToken({
        user_id: 1,
        expires_at: new Date(Date.now() + 86400000),
      });
      refreshTokenRepository.findByTokenHash.mockResolvedValue(storedToken);
      userRepository.findById.mockResolvedValue(mockUser({ id: 1 }));
      refreshTokenRepository.revokeByTokenHash.mockResolvedValue(undefined);
      refreshTokenRepository.create.mockResolvedValue({} as any);

      // Act
      await service.refresh(rawToken);

      // Assert
      expect(refreshTokenRepository.revokeByTokenHash).toHaveBeenCalledWith(
        expect.any(String),
      );
    });

    it('should store new refresh token for the user', async () => {
      // Arrange
      const storedToken = mockRefreshToken({
        user_id: 5,
        expires_at: new Date(Date.now() + 86400000),
      });
      refreshTokenRepository.findByTokenHash.mockResolvedValue(storedToken);
      userRepository.findById.mockResolvedValue(mockUser({ id: 5 }));
      refreshTokenRepository.revokeByTokenHash.mockResolvedValue(undefined);
      refreshTokenRepository.create.mockResolvedValue({} as any);

      // Act
      await service.refresh(rawToken);

      // Assert
      expect(refreshTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 5,
          token_hash: expect.any(String),
          expires_at: expect.any(Date),
        }),
      );
    });

    it('should throw UnauthorizedException (AUTH_003) if token not found', async () => {
      // Arrange
      refreshTokenRepository.findByTokenHash.mockResolvedValue(null);

      // Act & Assert
      await expect(service.refresh(rawToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should include AUTH_003 error code when token not found', async () => {
      // Arrange
      refreshTokenRepository.findByTokenHash.mockResolvedValue(null);

      // Act & Assert
      try {
        await service.refresh(rawToken);
        fail('Should have thrown');
      } catch (e: any) {
        expect(e.getResponse()).toEqual(
          expect.objectContaining({ code: 'AUTH_003' }),
        );
      }
    });

    it('should throw UnauthorizedException (AUTH_003) if token expired', async () => {
      // Arrange
      const expiredToken = mockRefreshToken({
        expires_at: new Date(Date.now() - 86400000), // expired yesterday
      });
      refreshTokenRepository.findByTokenHash.mockResolvedValue(expiredToken);

      // Act & Assert
      await expect(service.refresh(rawToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException (AUTH_005) if user not found', async () => {
      // Arrange
      const storedToken = mockRefreshToken({
        user_id: 999,
        expires_at: new Date(Date.now() + 86400000),
      });
      refreshTokenRepository.findByTokenHash.mockResolvedValue(storedToken);
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.refresh(rawToken)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException (AUTH_005) if user is deactivated', async () => {
      // Arrange
      const storedToken = mockRefreshToken({
        user_id: 1,
        expires_at: new Date(Date.now() + 86400000),
      });
      refreshTokenRepository.findByTokenHash.mockResolvedValue(storedToken);
      userRepository.findById.mockResolvedValue(mockUser({ id: 1, is_active: false }));

      // Act & Assert
      await expect(service.refresh(rawToken)).rejects.toThrow(ForbiddenException);
    });

    it('should generate new JWT with correct user data', async () => {
      // Arrange
      const storedToken = mockRefreshToken({
        user_id: 3,
        expires_at: new Date(Date.now() + 86400000),
      });
      const user = mockUser({ id: 3, email: 'refresh@example.com', role_id: 2, role: mockAdminRole() });
      refreshTokenRepository.findByTokenHash.mockResolvedValue(storedToken);
      userRepository.findById.mockResolvedValue(user);
      refreshTokenRepository.revokeByTokenHash.mockResolvedValue(undefined);
      refreshTokenRepository.create.mockResolvedValue({} as any);

      // Act
      await service.refresh(rawToken);

      // Assert
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 3,
        roleId: 2,
      });
    });
  });

  // ═══════════════════════════════════════════
  // Auth: logout
  // ═══════════════════════════════════════════

  describe('logout', () => {
    it('should revoke refresh token by hash', async () => {
      // Arrange
      const rawToken = 'some-refresh-token';
      refreshTokenRepository.revokeByTokenHash.mockResolvedValue(undefined);

      // Act
      await service.logout(rawToken);

      // Assert
      expect(refreshTokenRepository.revokeByTokenHash).toHaveBeenCalledWith(
        expect.any(String),
      );
    });

    it('should hash the raw token before revoking', async () => {
      // Arrange
      refreshTokenRepository.revokeByTokenHash.mockResolvedValue(undefined);

      // Act
      await service.logout('token-a');
      const firstCallHash = refreshTokenRepository.revokeByTokenHash.mock.calls[0][0];

      await service.logout('token-b');
      const secondCallHash = refreshTokenRepository.revokeByTokenHash.mock.calls[1][0];

      // Assert — different tokens produce different hashes
      expect(firstCallHash).not.toBe(secondCallHash);
      expect(firstCallHash).not.toBe('token-a');
    });
  });

  // ═══════════════════════════════════════════
  // Auth: logoutAll
  // ═══════════════════════════════════════════

  describe('logoutAll', () => {
    it('should revoke all refresh tokens for the user', async () => {
      // Arrange
      refreshTokenRepository.revokeAllByUserId.mockResolvedValue(undefined);

      // Act
      await service.logoutAll(42);

      // Assert
      expect(refreshTokenRepository.revokeAllByUserId).toHaveBeenCalledWith(42);
    });
  });

  // ═══════════════════════════════════════════
  // Admin: findAllRoles
  // ═══════════════════════════════════════════

  describe('findAllRoles', () => {
    it('should return all roles with user count', async () => {
      // Arrange
      const roles = [
        mockRoleWithUserCount({ id: 1, name: 'customer', userCount: 10 }),
        mockRoleWithUserCount({ id: 2, name: 'admin', userCount: 2 }),
      ];
      roleRepository.findAllWithUserCount.mockResolvedValue(roles);

      // Act
      const result = await service.findAllRoles();

      // Assert
      expect(roleRepository.findAllWithUserCount).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].userCount).toBe(10);
    });
  });

  // ═══════════════════════════════════════════
  // Admin: findRoleById
  // ═══════════════════════════════════════════

  describe('findRoleById', () => {
    it('should return role with user count', async () => {
      // Arrange
      const role = mockRoleWithUserCount({ id: 1, name: 'customer', userCount: 10 });
      roleRepository.findByIdWithUserCount.mockResolvedValue(role);

      // Act
      const result = await service.findRoleById(1);

      // Assert
      expect(roleRepository.findByIdWithUserCount).toHaveBeenCalledWith(1);
      expect(result.name).toBe('customer');
      expect(result.userCount).toBe(10);
    });

    it('should throw NotFoundException if role not found', async () => {
      // Arrange
      roleRepository.findByIdWithUserCount.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findRoleById(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════
  // Admin: createRole
  // ═══════════════════════════════════════════

  describe('createRole', () => {
    it('should create a new role', async () => {
      // Arrange
      const dto = { name: 'seller' };
      const created = mockRole({ id: 3, name: 'seller' });
      roleRepository.existsByName.mockResolvedValue(false);
      roleRepository.create.mockResolvedValue(created);

      // Act
      const result = await service.createRole(dto);

      // Assert
      expect(roleRepository.create).toHaveBeenCalledWith({ name: 'seller' });
      expect(result.name).toBe('seller');
    });

    it('should throw ConflictException if role name already exists', async () => {
      // Arrange
      roleRepository.existsByName.mockResolvedValue(true);

      // Act & Assert
      await expect(service.createRole({ name: 'customer' })).rejects.toThrow(ConflictException);
    });

    it('should include ROLE_001 error code for duplicate role name', async () => {
      // Arrange
      roleRepository.existsByName.mockResolvedValue(true);

      // Act & Assert
      try {
        await service.createRole({ name: 'customer' });
        fail('Should have thrown');
      } catch (e: any) {
        expect(e.getResponse()).toEqual(
          expect.objectContaining({ code: 'ROLE_001' }),
        );
      }
    });

    it('should not call create when name is duplicate', async () => {
      // Arrange
      roleRepository.existsByName.mockResolvedValue(true);

      // Act
      try { await service.createRole({ name: 'customer' }); } catch {}

      // Assert
      expect(roleRepository.create).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════
  // Admin: updateRole
  // ═══════════════════════════════════════════

  describe('updateRole', () => {
    it('should update role name', async () => {
      // Arrange
      const existing = mockRole({ id: 3, name: 'seller' });
      const updated = mockRole({ id: 3, name: 'moderator' });
      roleRepository.findById.mockResolvedValue(existing);
      roleRepository.existsByName.mockResolvedValue(false);
      roleRepository.update.mockResolvedValue(updated);

      // Act
      const result = await service.updateRole(3, { name: 'moderator' });

      // Assert
      expect(roleRepository.update).toHaveBeenCalledWith(3, { name: 'moderator' });
      expect(result.name).toBe('moderator');
    });

    it('should throw NotFoundException if role not found', async () => {
      // Arrange
      roleRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateRole(999, { name: 'test' })).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if new name already taken', async () => {
      // Arrange
      roleRepository.findById.mockResolvedValue(mockRole({ id: 3, name: 'seller' }));
      roleRepository.existsByName.mockResolvedValue(true);

      // Act & Assert
      await expect(service.updateRole(3, { name: 'customer' })).rejects.toThrow(ConflictException);
    });

    it('should skip name uniqueness check if name unchanged', async () => {
      // Arrange
      const existing = mockRole({ id: 3, name: 'seller' });
      roleRepository.findById.mockResolvedValue(existing);
      roleRepository.update.mockResolvedValue(existing);

      // Act
      await service.updateRole(3, { name: 'seller' });

      // Assert
      expect(roleRepository.existsByName).not.toHaveBeenCalled();
    });

    it('should skip name uniqueness check if name is undefined', async () => {
      // Arrange
      const existing = mockRole({ id: 3, name: 'seller' });
      roleRepository.findById.mockResolvedValue(existing);
      roleRepository.update.mockResolvedValue(existing);

      // Act
      await service.updateRole(3, {});

      // Assert
      expect(roleRepository.existsByName).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════
  // Admin: deleteRole
  // ═══════════════════════════════════════════

  describe('deleteRole', () => {
    it('should delete role without users', async () => {
      // Arrange
      roleRepository.findById.mockResolvedValue(mockRole({ id: 3, name: 'seller' }));
      roleRepository.hasUsers.mockResolvedValue(false);
      roleRepository.delete.mockResolvedValue(undefined);

      // Act
      await service.deleteRole(3);

      // Assert
      expect(roleRepository.delete).toHaveBeenCalledWith(3);
    });

    it('should throw NotFoundException if role not found', async () => {
      // Arrange
      roleRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteRole(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if role has assigned users', async () => {
      // Arrange
      roleRepository.findById.mockResolvedValue(mockRole({ id: 1 }));
      roleRepository.hasUsers.mockResolvedValue(true);

      // Act & Assert
      await expect(service.deleteRole(1)).rejects.toThrow(BadRequestException);
    });

    it('should include ROLE_002 error code when role has users', async () => {
      // Arrange
      roleRepository.findById.mockResolvedValue(mockRole({ id: 1 }));
      roleRepository.hasUsers.mockResolvedValue(true);

      // Act & Assert
      try {
        await service.deleteRole(1);
        fail('Should have thrown');
      } catch (e: any) {
        expect(e.getResponse()).toEqual(
          expect.objectContaining({ code: 'ROLE_002' }),
        );
      }
    });

    it('should not call delete when role has users', async () => {
      // Arrange
      roleRepository.findById.mockResolvedValue(mockRole({ id: 1 }));
      roleRepository.hasUsers.mockResolvedValue(true);

      // Act
      try { await service.deleteRole(1); } catch {}

      // Assert
      expect(roleRepository.delete).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════
  // Admin: findAllUsers
  // ═══════════════════════════════════════════

  describe('findAllUsers', () => {
    it('should return paginated users', async () => {
      // Arrange
      const query = { page: 1, limit: 20 } as any;
      const paginatedResult = {
        data: [mockUser()],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      userRepository.findAllPaginated.mockResolvedValue(paginatedResult);

      // Act
      const result = await service.findAllUsers(query);

      // Assert
      expect(userRepository.findAllPaginated).toHaveBeenCalledWith(query);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should pass filter params to repository', async () => {
      // Arrange
      const query = { page: 1, limit: 10, search: 'test', role: 'customer', is_active: 'true', sort: 'email', order: 'asc' as const };
      const paginatedResult = {
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };
      userRepository.findAllPaginated.mockResolvedValue(paginatedResult);

      // Act
      await service.findAllUsers(query);

      // Assert
      expect(userRepository.findAllPaginated).toHaveBeenCalledWith(query);
    });
  });

  // ═══════════════════════════════════════════
  // Admin: findUserById
  // ═══════════════════════════════════════════

  describe('findUserById', () => {
    it('should return user with order and review counts', async () => {
      // Arrange
      const userWithStats = mockUserWithStats({ id: 1, orderCount: 5, reviewCount: 3 });
      userRepository.findByIdWithStats.mockResolvedValue(userWithStats);

      // Act
      const result = await service.findUserById(1);

      // Assert
      expect(userRepository.findByIdWithStats).toHaveBeenCalledWith(1);
      expect(result.orderCount).toBe(5);
      expect(result.reviewCount).toBe(3);
    });

    it('should throw NotFoundException if user not found', async () => {
      // Arrange
      userRepository.findByIdWithStats.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findUserById(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════
  // Admin: toggleActivate
  // ═══════════════════════════════════════════

  describe('toggleActivate', () => {
    it('should deactivate an active user', async () => {
      // Arrange
      const user = mockUser({ id: 1, is_active: true });
      userRepository.findById.mockResolvedValue(user);
      userRepository.updateIsActive.mockResolvedValue(undefined);

      // Act
      const result = await service.toggleActivate(1);

      // Assert
      expect(userRepository.updateIsActive).toHaveBeenCalledWith(1, false);
      expect(result.is_active).toBe(false);
    });

    it('should activate a deactivated user', async () => {
      // Arrange
      const user = mockUser({ id: 1, is_active: false });
      userRepository.findById.mockResolvedValue(user);
      userRepository.updateIsActive.mockResolvedValue(undefined);

      // Act
      const result = await service.toggleActivate(1);

      // Assert
      expect(userRepository.updateIsActive).toHaveBeenCalledWith(1, true);
      expect(result.is_active).toBe(true);
    });

    it('should throw NotFoundException if user not found', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.toggleActivate(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════
  // Admin: changeUserRole
  // ═══════════════════════════════════════════

  describe('changeUserRole', () => {
    it('should change user role successfully', async () => {
      // Arrange
      const user = mockUser({ id: 1, role_id: 1, role: mockRole() });
      const adminRole = mockAdminRole();
      userRepository.findById.mockResolvedValue(user);
      roleRepository.findById.mockResolvedValue(adminRole);
      userRepository.updateRoleId.mockResolvedValue(undefined);

      // Act
      const result = await service.changeUserRole(1, { role_id: 2 });

      // Assert
      expect(userRepository.updateRoleId).toHaveBeenCalledWith(1, 2);
      expect(result.role_id).toBe(2);
      expect(result.role.name).toBe('admin');
    });

    it('should throw NotFoundException if user not found', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.changeUserRole(999, { role_id: 2 })).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if role not found', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(mockUser());
      roleRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.changeUserRole(1, { role_id: 999 })).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════
  // updateProfile
  // ═══════════════════════════════════════════

  describe('updateProfile', () => {
    it('should update user full_name and phone', async () => {
      // Arrange
      const user = mockUser({ id: 1 });
      const updated = mockUser({ id: 1, full_name: 'New Name', phone: '0909999999' });
      userRepository.findById.mockResolvedValue(user);
      userRepository.updateProfile.mockResolvedValue(updated);

      // Act
      const result = await service.updateProfile(1, { full_name: 'New Name', phone: '0909999999' });

      // Assert
      expect(userRepository.updateProfile).toHaveBeenCalledWith(1, { full_name: 'New Name', phone: '0909999999' });
      expect(result.full_name).toBe('New Name');
      expect(result.phone).toBe('0909999999');
    });

    it('should throw NotFoundException if user not found', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateProfile(999, { full_name: 'Test' })).rejects.toThrow(NotFoundException);
    });

    it('should update only full_name when phone is not provided', async () => {
      // Arrange
      const user = mockUser({ id: 1 });
      const updated = mockUser({ id: 1, full_name: 'Updated Name' });
      userRepository.findById.mockResolvedValue(user);
      userRepository.updateProfile.mockResolvedValue(updated);

      // Act
      const result = await service.updateProfile(1, { full_name: 'Updated Name' });

      // Assert
      expect(userRepository.updateProfile).toHaveBeenCalledWith(1, { full_name: 'Updated Name' });
      expect(result.full_name).toBe('Updated Name');
    });

    it('should update only phone when full_name is not provided', async () => {
      // Arrange
      const user = mockUser({ id: 1 });
      const updated = mockUser({ id: 1, phone: '0908888888' });
      userRepository.findById.mockResolvedValue(user);
      userRepository.updateProfile.mockResolvedValue(updated);

      // Act
      const result = await service.updateProfile(1, { phone: '0908888888' });

      // Assert
      expect(userRepository.updateProfile).toHaveBeenCalledWith(1, { phone: '0908888888' });
      expect(result.phone).toBe('0908888888');
    });

    it('should include USER_002 error code when user not found', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      try {
        await service.updateProfile(999, { full_name: 'Test' });
        fail('Should have thrown');
      } catch (e: any) {
        expect(e.getResponse()).toEqual(
          expect.objectContaining({ code: 'USER_002' }),
        );
      }
    });
  });
});
