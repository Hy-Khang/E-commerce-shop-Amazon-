import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserProfileService } from '../user-profile.service';
import { AddressRepository } from '../repositories/address.repository';
import { AuthService } from '../../auth/auth.service';

describe('UserProfileService', () => {
  let service: UserProfileService;
  let addressRepository: jest.Mocked<AddressRepository>;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockAddressRepo = {
      findAllByUserId: jest.fn(),
      findByIdAndUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      clearDefaultByUserId: jest.fn(),
      setDefault: jest.fn(),
    };

    const mockAuthService = {
      findUserById: jest.fn(),
      updateProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserProfileService,
        { provide: AddressRepository, useValue: mockAddressRepo },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    service = module.get<UserProfileService>(UserProfileService);
    addressRepository = module.get(AddressRepository);
    authService = module.get(AuthService);
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const user = {
        id: 1,
        email: 'test@test.com',
        full_name: 'Test User',
        phone: '0901234567',
        is_active: true,
        created_at: new Date(),
        orderCount: 0,
        reviewCount: 0,
      };
      authService.findUserById.mockResolvedValue(user as any);

      const result = await service.getProfile(1);

      expect(result.email).toBe('test@test.com');
      expect(result.full_name).toBe('Test User');
    });
  });

  describe('createAddress', () => {
    it('should create address and clear defaults if is_default is true', async () => {
      const dto = { full_name: 'Test', phone: '0901234567', address_line: '123 St', city: 'HCM', is_default: true };
      const address = { id: 1, user_id: 1, ...dto };
      addressRepository.create.mockResolvedValue(address as any);

      const result = await service.createAddress(1, dto);

      expect(addressRepository.clearDefaultByUserId).toHaveBeenCalledWith(1);
      expect(addressRepository.create).toHaveBeenCalledWith({ user_id: 1, ...dto });
      expect(result.id).toBe(1);
    });

    it('should create address without clearing defaults if is_default is false', async () => {
      const dto = { full_name: 'Test', phone: '0901234567', address_line: '123 St', city: 'HCM' };
      const address = { id: 1, user_id: 1, ...dto, is_default: false };
      addressRepository.create.mockResolvedValue(address as any);

      await service.createAddress(1, dto);

      expect(addressRepository.clearDefaultByUserId).not.toHaveBeenCalled();
    });
  });

  describe('deleteAddress', () => {
    it('should throw NotFoundException if address not found', async () => {
      addressRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.deleteAddress(1, 99)).rejects.toThrow(NotFoundException);
    });

    it('should delete address if found', async () => {
      const address = { id: 1, user_id: 1, full_name: 'Test', phone: '0901234567', address_line: '123', city: 'HCM', is_default: false };
      addressRepository.findByIdAndUserId.mockResolvedValue(address as any);

      await service.deleteAddress(1, 1);

      expect(addressRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('setDefaultAddress', () => {
    it('should throw NotFoundException if address not found', async () => {
      addressRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.setDefaultAddress(1, 99)).rejects.toThrow(NotFoundException);
    });

    it('should clear all defaults and set new default', async () => {
      const address = { id: 2, user_id: 1, full_name: 'Test', phone: '0901234567', address_line: '123', city: 'HCM', is_default: false };
      addressRepository.findByIdAndUserId.mockResolvedValue(address as any);

      const result = await service.setDefaultAddress(1, 2);

      expect(addressRepository.clearDefaultByUserId).toHaveBeenCalledWith(1);
      expect(addressRepository.setDefault).toHaveBeenCalledWith(2);
      expect(result.is_default).toBe(true);
    });
  });
});
