import { Test, TestingModule } from '@nestjs/testing';
import { AdminRoleController } from '../admin-role.controller';
import { AuthService } from '../auth.service';
import { mockRole, mockRoleWithUserCount } from './mocks/auth.mock';

describe('AdminRoleController', () => {
  let controller: AdminRoleController;
  let service: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockAuthService = {
      findAllRoles: jest.fn(),
      findRoleById: jest.fn(),
      createRole: jest.fn(),
      updateRole: jest.fn(),
      deleteRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminRoleController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AdminRoleController>(AdminRoleController);
    service = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call authService.findAllRoles and return result', async () => {
      // Arrange
      const roles = [
        mockRoleWithUserCount({ id: 1, name: 'customer', userCount: 10 }),
        mockRoleWithUserCount({ id: 2, name: 'admin', userCount: 2 }),
      ];
      service.findAllRoles.mockResolvedValue(roles);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(service.findAllRoles).toHaveBeenCalled();
      expect(result).toEqual(roles);
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should call authService.findRoleById with correct id', async () => {
      // Arrange
      const role = mockRoleWithUserCount({
        id: 1,
        name: 'customer',
        userCount: 10,
      });
      service.findRoleById.mockResolvedValue(role);

      // Act
      const result = await controller.findOne(1);

      // Assert
      expect(service.findRoleById).toHaveBeenCalledWith(1);
      expect(result).toEqual(role);
    });
  });

  describe('create', () => {
    it('should call authService.createRole with dto', async () => {
      // Arrange
      const dto = { name: 'seller' };
      const created = mockRole({ id: 3, name: 'seller' });
      service.createRole.mockResolvedValue(created);

      // Act
      const result = await controller.create(dto);

      // Assert
      expect(service.createRole).toHaveBeenCalledWith(dto);
      expect(result.name).toBe('seller');
    });
  });

  describe('update', () => {
    it('should call authService.updateRole with id and dto', async () => {
      // Arrange
      const dto = { name: 'moderator' };
      const updated = mockRole({ id: 3, name: 'moderator' });
      service.updateRole.mockResolvedValue(updated);

      // Act
      const result = await controller.update(3, dto);

      // Assert
      expect(service.updateRole).toHaveBeenCalledWith(3, dto);
      expect(result.name).toBe('moderator');
    });
  });

  describe('remove', () => {
    it('should call authService.deleteRole with correct id', async () => {
      // Arrange
      service.deleteRole.mockResolvedValue(undefined);

      // Act
      await controller.remove(3);

      // Assert
      expect(service.deleteRole).toHaveBeenCalledWith(3);
    });
  });
});
