import { Test, TestingModule } from '@nestjs/testing';
import { UserProfileController } from '../user-profile.controller';
import { UserProfileService } from '../user-profile.service';
import { ICurrentUser } from '../../../common/interfaces/current-user.interface';

describe('UserProfileController', () => {
  let controller: UserProfileController;
  let service: jest.Mocked<UserProfileService>;

  const mockUser: ICurrentUser = { id: 1, email: 'test@test.com', role: 'customer' };

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

  describe('getProfile', () => {
    it('should return current user profile', async () => {
      const profile = {
        id: 1,
        email: 'test@test.com',
        full_name: 'Test User',
        phone: '0901234567',
        is_active: true,
        created_at: new Date(),
      };
      service.getProfile.mockResolvedValue(profile);

      const result = await controller.getProfile(mockUser);

      expect(service.getProfile).toHaveBeenCalledWith(1);
      expect(result).toEqual(profile);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const dto = { full_name: 'Updated Name' };
      const profile = {
        id: 1,
        email: 'test@test.com',
        full_name: 'Updated Name',
        phone: null,
        is_active: true,
        created_at: new Date(),
      };
      service.updateProfile.mockResolvedValue(profile);

      const result = await controller.updateProfile(mockUser, dto);

      expect(service.updateProfile).toHaveBeenCalledWith(1, dto);
      expect(result.full_name).toBe('Updated Name');
    });
  });

  describe('findAll addresses', () => {
    it('should return list of addresses', async () => {
      const addresses = [
        { id: 1, user_id: 1, full_name: 'Test', phone: '0901234567', address_line: '123 St', city: 'HCM', is_default: true },
      ];
      service.findAllAddresses.mockResolvedValue(addresses as any);

      const result = await controller.findAll(mockUser);

      expect(service.findAllAddresses).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(1);
    });
  });

  describe('create address', () => {
    it('should create a new address', async () => {
      const dto = { full_name: 'Test', phone: '0901234567', address_line: '123 St', city: 'HCM' };
      const address = { id: 1, user_id: 1, ...dto, is_default: false };
      service.createAddress.mockResolvedValue(address as any);

      const result = await controller.create(mockUser, dto);

      expect(service.createAddress).toHaveBeenCalledWith(1, dto);
      expect(result.id).toBe(1);
    });
  });

  describe('delete address', () => {
    it('should delete address', async () => {
      service.deleteAddress.mockResolvedValue(undefined);

      await controller.delete(mockUser, 1);

      expect(service.deleteAddress).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('setDefault', () => {
    it('should set address as default', async () => {
      const address = { id: 1, user_id: 1, full_name: 'Test', phone: '0901234567', address_line: '123 St', city: 'HCM', is_default: true };
      service.setDefaultAddress.mockResolvedValue(address as any);

      const result = await controller.setDefault(mockUser, 1);

      expect(service.setDefaultAddress).toHaveBeenCalledWith(1, 1);
      expect(result.is_default).toBe(true);
    });
  });
});
