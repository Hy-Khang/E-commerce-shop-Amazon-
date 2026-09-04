import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { AuthService } from '../auth.service';
import { AuthController } from '../auth.controller';
import {
  ILoginResponse,
  IRegisterResponse,
  ITokenPair,
} from '../types/auth.types';

describe('Auth — Refresh Token Rotation (e2e)', () => {
  let app: INestApplication;
  let authService: jest.Mocked<AuthService>;

  const mockLoginResponse: ILoginResponse = {
    accessToken: 'access-token-1',
    refreshToken: 'refresh-token-1',
    user: {
      id: 1,
      email: 'user@example.com',
      full_name: 'Nguyen Van A',
      role: 'customer',
      role_id: 1,
      permissions: [],
      email_verified: true,
      has_password: true,
      providers: [],
    },
  };

  const mockNewTokenPair: ITokenPair = {
    accessToken: 'access-token-2',
    refreshToken: 'refresh-token-2',
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            refresh: jest.fn(),
            logout: jest.fn(),
            logoutAll: jest.fn(),
            getMe: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn((_key: string, def?: unknown) => def) },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    authService = module.get(AuthService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/login → POST /auth/refresh → new token pair', () => {
    it('should login then refresh to get a new token pair', async () => {
      // Arrange — login
      authService.login.mockResolvedValue(mockLoginResponse);

      // Act — login
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'user@example.com', password: 'securePassword123' })
        .expect(200);

      expect(loginRes.body.accessToken).toBe('access-token-1');
      expect(loginRes.body.refreshToken).toBe('refresh-token-1');

      // Arrange — refresh
      authService.refresh.mockResolvedValue(mockNewTokenPair);

      // Act — refresh
      const refreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: loginRes.body.refreshToken })
        .expect(200);

      // Assert — new tokens issued
      expect(refreshRes.body.accessToken).toBe('access-token-2');
      expect(refreshRes.body.refreshToken).toBe('refresh-token-2');
      expect(authService.refresh).toHaveBeenCalledWith('refresh-token-1');
    });
  });

  describe('POST /auth/refresh with expired/revoked token', () => {
    it('should return 401 when refresh token is expired', async () => {
      // Arrange
      const { UnauthorizedException } = require('@nestjs/common');
      authService.refresh.mockRejectedValue(
        new UnauthorizedException({
          code: 'AUTH_003',
          message: 'Refresh token expired or revoked',
        }),
      );

      // Act & Assert
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'expired-token' })
        .expect(401);

      expect(res.body.message).toBeDefined();
    });
  });

  describe('POST /auth/logout → POST /auth/refresh', () => {
    it('should reject refresh after token is revoked via logout', async () => {
      // Arrange — login
      authService.login.mockResolvedValue(mockLoginResponse);

      // Act — login
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'user@example.com', password: 'securePassword123' })
        .expect(200);

      // Arrange — logout succeeds, then refresh fails
      authService.logout.mockResolvedValue(undefined);
      const { UnauthorizedException } = require('@nestjs/common');
      authService.refresh.mockRejectedValue(
        new UnauthorizedException({
          code: 'AUTH_003',
          message: 'Refresh token expired or revoked',
        }),
      );

      // Act — logout with the refresh token
      await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken: loginRes.body.refreshToken })
        .expect(200);

      // Act — attempt refresh with revoked token
      const refreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: loginRes.body.refreshToken })
        .expect(401);

      // Assert
      expect(refreshRes.body.message).toBeDefined();
      expect(authService.logout).toHaveBeenCalledWith('refresh-token-1');
    });
  });

  describe('POST /auth/register → verification code sent', () => {
    it('should register and return verification info', async () => {
      // Arrange
      const registerResponse: IRegisterResponse = {
        email: 'new@example.com',
        expiresIn: 300,
        message: 'Verification code sent to your email',
      };
      authService.register.mockResolvedValue(registerResponse);

      // Act
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'new@example.com',
          password: 'securePassword123',
          full_name: 'New User',
        })
        .expect(201);

      // Assert
      expect(res.body.email).toBe('new@example.com');
      expect(res.body.expiresIn).toBe(300);
      expect(res.body.message).toBeDefined();
    });
  });

  describe('POST /auth/logout', () => {
    it('should revoke refresh token and return 200', async () => {
      // Arrange
      authService.logout.mockResolvedValue(undefined);

      // Act
      await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken: 'some-token' })
        .expect(200);

      // Assert
      expect(authService.logout).toHaveBeenCalledWith('some-token');
    });
  });

  describe('POST /auth/register — validation', () => {
    it('should return 400 when email is missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ password: 'securePassword123', full_name: 'Test User' })
        .expect(400);
    });

    it('should return 400 when email is invalid format', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'not-an-email',
          password: 'securePassword123',
          full_name: 'Test User',
        })
        .expect(400);
    });

    it('should return 400 when password is too short', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'valid@example.com',
          password: 'short',
          full_name: 'Test User',
        })
        .expect(400);
    });

    it('should return 400 when full_name is missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'valid@example.com', password: 'securePassword123' })
        .expect(400);
    });

    it('should strip unknown fields (whitelist)', async () => {
      // Arrange
      const registerResponse: IRegisterResponse = {
        email: 'valid@example.com',
        expiresIn: 300,
        message: 'Verification code sent to your email',
      };
      authService.register.mockResolvedValue(registerResponse);

      // Act
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'valid@example.com',
          password: 'securePassword123',
          full_name: 'Test User',
          is_admin: true,
          role_id: 2,
        })
        .expect(400);
    });
  });

  describe('POST /auth/login — validation', () => {
    it('should return 400 when email is missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'password123' })
        .expect(400);
    });

    it('should return 400 when password is missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'user@example.com' })
        .expect(400);
    });

    it('should return 400 when body is empty', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    });
  });

  describe('POST /auth/refresh — validation', () => {
    it('should return 400 when refreshToken is missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({})
        .expect(400);
    });
  });
});
