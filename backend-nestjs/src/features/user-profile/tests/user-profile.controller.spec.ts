import { Test, TestingModule } from '@nestjs/testing';
import { UserProfileController } from '../user-profile.controller';
import { UserProfileService } from '../user-profile.service';
import { ICurrentUser } from '../../../common/interfaces/current-user.interface';
import {
  mockAddress,
  mockDefaultAddress,
  mockUserProfile,
} from './mocks/user-profile.mock';

describe('UserProfileController', () => {
  let controller: UserProfileController;
  let service: jest.Mocked<UserProfileService>;

  const mockUser: ICurrentUser = { id: 1, roleId: 1 };

  beforeEach(async () => {
    const mockService = {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      findAllAddresses: jest.fn(),
      createAddress: jest.fn(),
      updateAddress: jest.fn(),
      deleteAddress: jest.fn(),
      setDefaultAddress: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserProfileController],
      providers: [{ provide: UserProfileService, useValue: mockService }],
    }).compile();

    controller = module.get<UserProfileController>(UserProfileController);
    service = module.get(UserProfileService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should call service.getProfile with user id from JWT', async () => {
      // Arrange
      const profile = mockUserProfile();
      service.getProfile.mockResolvedValue(profile);

      // Act
      const result = await controller.getProfile(mockUser);

      // Assert
      expect(service.getProfile).toHaveBeenCalledWith(1);
      expect(result).toEqual(profile);
    });
  });

  describe('updateProfile', () => {
    it('should call service.updateProfile with user id and dto', async () => {
      // Arrange
      const dto = { full_name: 'Updated Name' };
      const profile = mockUserProfile({ full_name: 'Updated Name' });
      service.updateProfile.mockResolvedValue(profile);

      // Act
      const result = await controller.updateProfile(mockUser, dto);

      // Assert
      expect(service.updateProfile).toHaveBeenCalledWith(1, dto);
      expect(result.full_name).toBe('Updated Name');
    });
  });

  describe('findAll', () => {
    it('should call service.findAllAddresses with user id', async () => {
      // Arrange
      const addresses = [mockDefaultAddress(), mockAddress({ id: 2 })];
      service.findAllAddresses.mockResolvedValue(addresses);

      // Act
      const result = await controller.findAll(mockUser);

      // Assert
      expect(service.findAllAddresses).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when user has no addresses', async () => {
      // Arrange
      service.findAllAddresses.mockResolvedValue([]);

      // Act
      const result = await controller.findAll(mockUser);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should call service.createAddress with user id and dto', async () => {
      // Arrange
      const dto = {
        full_name: 'Test',
        phone: '0901234567',
        address_line: '123 St',
        city: 'HCM',
      };
      const address = mockAddress({ ...dto });
      service.createAddress.mockResolvedValue(address);

      // Act
      const result = await controller.create(mockUser, dto);

      // Assert
      expect(service.createAddress).toHaveBeenCalledWith(1, dto);
      expect(result.id).toBe(1);
    });
  });

  describe('update', () => {
    it('should call service.updateAddress with user id, address id, and dto', async () => {
      // Arrange
      const dto = { full_name: 'Updated Name', city: 'Ha Noi' };
      const updated = mockAddress({
        id: 5,
        full_name: 'Updated Name',
        city: 'Ha Noi',
      });
      service.updateAddress.mockResolvedValue(updated);

      // Act
      const result = await controller.update(mockUser, 5, dto);

      // Assert
      expect(service.updateAddress).toHaveBeenCalledWith(1, 5, dto);
      expect(result.full_name).toBe('Updated Name');
      expect(result.city).toBe('Ha Noi');
    });
  });

  describe('delete', () => {
    it('should call service.deleteAddress with user id and address id', async () => {
      // Arrange
      service.deleteAddress.mockResolvedValue(undefined);

      // Act
      await controller.delete(mockUser, 5);

      // Assert
      expect(service.deleteAddress).toHaveBeenCalledWith(1, 5);
    });
  });

  describe('setDefault', () => {
    it('should call service.setDefaultAddress with user id and address id', async () => {
      // Arrange
      const address = mockDefaultAddress({ id: 3 });
      service.setDefaultAddress.mockResolvedValue(address);

      // Act
      const result = await controller.setDefault(mockUser, 3);

      // Assert
      expect(service.setDefaultAddress).toHaveBeenCalledWith(1, 3);
      expect(result.is_default).toBe(true);
    });
  });
});
