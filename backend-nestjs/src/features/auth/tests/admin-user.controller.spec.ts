import { Test, TestingModule } from '@nestjs/testing';
import { AdminUserController } from '../admin-user.controller';
import { AuthService } from '../auth.service';
import { mockUser, mockUserWithStats } from './mocks/auth.mock';

describe('AdminUserController', () => {
  let controller: AdminUserController;
  let service: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockAuthService = {
      findAllUsers: jest.fn(),
      findUserById: jest.fn(),
      toggleActivate: jest.fn(),
      changeUserRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUserController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AdminUserController>(AdminUserController);
    service = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call authService.findAllUsers with query params', async () => {
      // Arrange
      const query = { page: 1, limit: 20, search: 'test', sort: 'created_at', order: 'desc' as const };
      const expected = {
        data: [mockUser()],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      service.findAllUsers.mockResolvedValue(expected);

      // Act
      const result = await controller.findAll(query as any);

      // Assert
      expect(service.findAllUsers).toHaveBeenCalledWith(query);
      expect(result).toEqual(expected);
    });

    it('should return empty list when no users match', async () => {
      // Arrange
      const query = { page: 1, limit: 20 };
      const expected = {
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
      service.findAllUsers.mockResolvedValue(expected);

      // Act
      const result = await controller.findAll(query as any);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should call authService.findUserById with correct id', async () => {
      // Arrange
      const userWithStats = mockUserWithStats({ id: 1, orderCount: 5, reviewCount: 3 });
      service.findUserById.mockResolvedValue(userWithStats);

      // Act
      const result = await controller.findOne(1);

      // Assert
      expect(service.findUserById).toHaveBeenCalledWith(1);
      expect(result.orderCount).toBe(5);
      expect(result.reviewCount).toBe(3);
    });
  });

  describe('toggleActivate', () => {
    it('should call authService.toggleActivate with correct id', async () => {
      // Arrange
      const user = mockUser({ id: 1, is_active: false });
      service.toggleActivate.mockResolvedValue(user);

      // Act
      const result = await controller.toggleActivate(1);

      // Assert
      expect(service.toggleActivate).toHaveBeenCalledWith(1);
      expect(result.is_active).toBe(false);
    });
  });

  describe('changeRole', () => {
    it('should call authService.changeUserRole with id and dto', async () => {
      // Arrange
      const dto = { role_id: 2 };
      const user = mockUser({ id: 1, role_id: 2 });
      service.changeUserRole.mockResolvedValue(user);

      // Act
      const result = await controller.changeRole(1, dto);

      // Assert
      expect(service.changeUserRole).toHaveBeenCalledWith(1, dto);
      expect(result.role_id).toBe(2);
    });
  });
});
