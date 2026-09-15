import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
      logoutAll: jest.fn(),
      getMe: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        {
          // OAuth redirect handlers read FRONTEND_URL; return the supplied default.
          provide: ConfigService,
          useValue: { get: jest.fn((_key: string, def?: unknown) => def) },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register with dto', async () => {
      // Arrange
      const dto = {
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
      };
      const expected = {
        email: dto.email,
        expiresIn: 300,
        message: 'Verification code sent to your email',
      };
      service.register.mockResolvedValue(expected);

      // Act
      const result = await controller.register(dto);

      // Assert
      expect(service.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('login', () => {
    it('should call authService.login with dto', async () => {
      // Arrange
      const dto = { email: 'test@example.com', password: 'password123' };
      const expected = {
        accessToken: 'token',
        refreshToken: 'refresh',
        user: {
          id: 1,
          email: dto.email,
          full_name: 'Test User',
          role: 'customer',
          role_id: 1,
          permissions: [],
          email_verified: true,
          has_password: true,
          providers: [],
        },
      };
      service.login.mockResolvedValue(expected);

      // Act
      const result = await controller.login(dto);

      // Assert
      expect(service.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('refresh', () => {
    it('should call authService.refresh with token', async () => {
      // Arrange
      const dto = { refreshToken: 'some-token' };
      const expected = {
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      };
      service.refresh.mockResolvedValue(expected);

      // Act
      const result = await controller.refresh(dto);

      // Assert
      expect(service.refresh).toHaveBeenCalledWith('some-token');
      expect(result).toEqual(expected);
    });
  });

  describe('logout', () => {
    it('should call authService.logout with token', async () => {
      // Arrange
      const dto = { refreshToken: 'some-token' };
      service.logout.mockResolvedValue(undefined);

      // Act
      await controller.logout(dto);

      // Assert
      expect(service.logout).toHaveBeenCalledWith('some-token');
    });
  });

  describe('logoutAll', () => {
    it('should call authService.logoutAll with user id', async () => {
      // Arrange
      const user = { id: 1, roleId: 1 };
      service.logoutAll.mockResolvedValue(undefined);

      // Act
      await controller.logoutAll(user);

      // Assert
      expect(service.logoutAll).toHaveBeenCalledWith(1);
    });
  });
});
