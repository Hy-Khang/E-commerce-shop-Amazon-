import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserProfileService } from '../user-profile.service';
import { AddressRepository } from '../repositories/address.repository';
import { AuthService } from '../../auth/auth.service';
import { mockAddress, mockDefaultAddress } from './mocks/user-profile.mock';

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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═══════════════════════════════════════════
  // getProfile
  // ═══════════════════════════════════════════

  describe('getProfile', () => {
    it('should return mapped user profile response', async () => {
      // Arrange
      const user = {
        id: 1,
        email: 'test@example.com',
        full_name: 'Nguyen Van A',
        phone: '0901234567',
        is_active: true,
        created_at: new Date('2026-01-01'),
        orderCount: 5,
        reviewCount: 3,
      };
      authService.findUserById.mockResolvedValue(user as any);

      // Act
      const result = await service.getProfile(1);

      // Assert
      expect(authService.findUserById).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        full_name: 'Nguyen Van A',
        phone: '0901234567',
        is_active: true,
        created_at: expect.any(Date),
      });
    });

    it('should not expose password_hash or other sensitive fields', async () => {
      // Arrange
      const user = {
        id: 1,
        email: 'test@example.com',
        full_name: 'Test',
        phone: null,
        is_active: true,
        created_at: new Date(),
        password_hash: '$2b$10$secret',
        role_id: 1,
        orderCount: 0,
        reviewCount: 0,
      };
      authService.findUserById.mockResolvedValue(user as any);

      // Act
      const result = await service.getProfile(1);

      // Assert
      expect(result).not.toHaveProperty('password_hash');
      expect(result).not.toHaveProperty('role_id');
      expect(result).not.toHaveProperty('orderCount');
    });

    it('should return null phone when user has no phone', async () => {
      // Arrange
      const user = {
        id: 1,
        email: 'test@example.com',
        full_name: 'Test',
        phone: null,
        is_active: true,
        created_at: new Date(),
        orderCount: 0,
        reviewCount: 0,
      };
      authService.findUserById.mockResolvedValue(user as any);

      // Act
      const result = await service.getProfile(1);

      // Assert
      expect(result.phone).toBeNull();
    });
  });

  // ═══════════════════════════════════════════
  // updateProfile
  // ═══════════════════════════════════════════

  describe('updateProfile', () => {
    it('should update full_name and phone and return mapped response', async () => {
      // Arrange
      const dto = { full_name: 'Updated Name', phone: '0909999999' };
      const updatedUser = {
        id: 1,
        email: 'test@example.com',
        full_name: 'Updated Name',
        phone: '0909999999',
        is_active: true,
        created_at: new Date(),
      };
      authService.updateProfile.mockResolvedValue(updatedUser as any);

      // Act
      const result = await service.updateProfile(1, dto);

      // Assert
      expect(authService.updateProfile).toHaveBeenCalledWith(1, dto);
      expect(result.full_name).toBe('Updated Name');
      expect(result.phone).toBe('0909999999');
    });

    it('should update only full_name when phone is not provided', async () => {
      // Arrange
      const dto = { full_name: 'New Name' };
      const updatedUser = {
        id: 1,
        email: 'test@example.com',
        full_name: 'New Name',
        phone: '0901234567',
        is_active: true,
        created_at: new Date(),
      };
      authService.updateProfile.mockResolvedValue(updatedUser as any);

      // Act
      const result = await service.updateProfile(1, dto);

      // Assert
      expect(authService.updateProfile).toHaveBeenCalledWith(1, {
        full_name: 'New Name',
      });
      expect(result.full_name).toBe('New Name');
    });

    it('should update only phone when full_name is not provided', async () => {
      // Arrange
      const dto = { phone: '0908888888' };
      const updatedUser = {
        id: 1,
        email: 'test@example.com',
        full_name: 'Nguyen Van A',
        phone: '0908888888',
        is_active: true,
        created_at: new Date(),
      };
      authService.updateProfile.mockResolvedValue(updatedUser as any);

      // Act
      const result = await service.updateProfile(1, dto);

      // Assert
      expect(authService.updateProfile).toHaveBeenCalledWith(1, {
        phone: '0908888888',
      });
      expect(result.phone).toBe('0908888888');
    });

    it('should not expose sensitive fields in response', async () => {
      // Arrange
      const dto = { full_name: 'Test' };
      const updatedUser = {
        id: 1,
        email: 'test@example.com',
        full_name: 'Test',
        phone: null,
        is_active: true,
        created_at: new Date(),
        password_hash: '$2b$10$secret',
      };
      authService.updateProfile.mockResolvedValue(updatedUser as any);

      // Act
      const result = await service.updateProfile(1, dto);

      // Assert
      expect(result).not.toHaveProperty('password_hash');
    });
  });

  // ═══════════════════════════════════════════
  // findAllAddresses
  // ═══════════════════════════════════════════

  describe('findAllAddresses', () => {
    it('should return all addresses for user', async () => {
      // Arrange
      const addresses = [
        mockDefaultAddress({ id: 1 }),
        mockAddress({ id: 2 }),
        mockAddress({ id: 3 }),
      ];
      addressRepository.findAllByUserId.mockResolvedValue(addresses);

      // Act
      const result = await service.findAllAddresses(1);

      // Assert
      expect(addressRepository.findAllByUserId).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when user has no addresses', async () => {
      // Arrange
      addressRepository.findAllByUserId.mockResolvedValue([]);

      // Act
      const result = await service.findAllAddresses(1);

      // Assert
      expect(result).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════
  // createAddress
  // ═══════════════════════════════════════════

  describe('createAddress', () => {
    const dto = {
      full_name: 'Nguyen Van A',
      phone: '0901234567',
      address_line: '123 Le Loi',
      city: 'Ho Chi Minh',
    };

    it('should create address with user_id attached', async () => {
      // Arrange
      const address = mockAddress({ id: 1 });
      addressRepository.create.mockResolvedValue(address);

      // Act
      const result = await service.createAddress(5, dto);

      // Assert
      expect(addressRepository.create).toHaveBeenCalledWith({
        user_id: 5,
        ...dto,
      });
      expect(result.id).toBe(1);
    });

    it('should clear existing defaults when is_default is true', async () => {
      // Arrange
      const defaultDto = { ...dto, is_default: true };
      const address = mockAddress({ id: 1, is_default: true });
      addressRepository.create.mockResolvedValue(address);

      // Act
      await service.createAddress(1, defaultDto);

      // Assert
      expect(addressRepository.clearDefaultByUserId).toHaveBeenCalledWith(1);
      expect(addressRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ is_default: true }),
      );
    });

    it('should not clear defaults when is_default is false or undefined', async () => {
      // Arrange
      addressRepository.create.mockResolvedValue(mockAddress());

      // Act
      await service.createAddress(1, dto);

      // Assert
      expect(addressRepository.clearDefaultByUserId).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════
  // updateAddress
  // ═══════════════════════════════════════════

  describe('updateAddress', () => {
    it('should update address when found', async () => {
      // Arrange
      const existing = mockAddress({ id: 3, user_id: 1 });
      const updated = mockAddress({
        id: 3,
        user_id: 1,
        full_name: 'Updated Name',
      });
      addressRepository.findByIdAndUserId.mockResolvedValue(existing);
      addressRepository.update.mockResolvedValue(updated);

      // Act
      const result = await service.updateAddress(1, 3, {
        full_name: 'Updated Name',
      });

      // Assert
      expect(addressRepository.findByIdAndUserId).toHaveBeenCalledWith(3, 1);
      expect(addressRepository.update).toHaveBeenCalledWith(3, {
        full_name: 'Updated Name',
      });
      expect(result.full_name).toBe('Updated Name');
    });

    it('should throw NotFoundException if address not found', async () => {
      // Arrange
      addressRepository.findByIdAndUserId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateAddress(1, 99, { full_name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should include COMMON_001 error code when address not found', async () => {
      // Arrange
      addressRepository.findByIdAndUserId.mockResolvedValue(null);

      // Act & Assert
      try {
        await service.updateAddress(1, 99, { full_name: 'Test' });
        fail('Should have thrown');
      } catch (e: any) {
        expect(e.getResponse()).toEqual(
          expect.objectContaining({ code: 'COMMON_001' }),
        );
      }
    });

    it('should not call update when address not found', async () => {
      // Arrange
      addressRepository.findByIdAndUserId.mockResolvedValue(null);

      // Act
      try {
        await service.updateAddress(1, 99, { full_name: 'Test' });
      } catch {}

      // Assert
      expect(addressRepository.update).not.toHaveBeenCalled();
    });

    it('should clear existing defaults when is_default is true', async () => {
      // Arrange
      const existing = mockAddress({ id: 3, user_id: 1 });
      addressRepository.findByIdAndUserId.mockResolvedValue(existing);
      addressRepository.update.mockResolvedValue(
        mockAddress({ id: 3, is_default: true }),
      );

      // Act
      await service.updateAddress(1, 3, { is_default: true });

      // Assert
      expect(addressRepository.clearDefaultByUserId).toHaveBeenCalledWith(1);
    });

    it('should not clear defaults when is_default is not set', async () => {
      // Arrange
      const existing = mockAddress({ id: 3, user_id: 1 });
      addressRepository.findByIdAndUserId.mockResolvedValue(existing);
      addressRepository.update.mockResolvedValue(
        mockAddress({ id: 3, city: 'Ha Noi' }),
      );

      // Act
      await service.updateAddress(1, 3, { city: 'Ha Noi' });

      // Assert
      expect(addressRepository.clearDefaultByUserId).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════
  // deleteAddress
  // ═══════════════════════════════════════════

  describe('deleteAddress', () => {
    it('should delete address when found', async () => {
      // Arrange
      const address = mockAddress({ id: 5, user_id: 1 });
      addressRepository.findByIdAndUserId.mockResolvedValue(address);

      // Act
      await service.deleteAddress(1, 5);

      // Assert
      expect(addressRepository.findByIdAndUserId).toHaveBeenCalledWith(5, 1);
      expect(addressRepository.delete).toHaveBeenCalledWith(5);
    });

    it('should throw NotFoundException if address not found', async () => {
      // Arrange
      addressRepository.findByIdAndUserId.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteAddress(1, 99)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should include COMMON_001 error code when address not found', async () => {
      // Arrange
      addressRepository.findByIdAndUserId.mockResolvedValue(null);

      // Act & Assert
      try {
        await service.deleteAddress(1, 99);
        fail('Should have thrown');
      } catch (e: any) {
        expect(e.getResponse()).toEqual(
          expect.objectContaining({ code: 'COMMON_001' }),
        );
      }
    });

    it('should not call delete when address not found', async () => {
      // Arrange
      addressRepository.findByIdAndUserId.mockResolvedValue(null);

      // Act
      try {
        await service.deleteAddress(1, 99);
      } catch {}

      // Assert
      expect(addressRepository.delete).not.toHaveBeenCalled();
    });

    it('should enforce ownership — address must belong to user', async () => {
      // Arrange
      addressRepository.findByIdAndUserId.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteAddress(2, 1)).rejects.toThrow(
        NotFoundException,
      );
      expect(addressRepository.findByIdAndUserId).toHaveBeenCalledWith(1, 2);
    });
  });

  // ═══════════════════════════════════════════
  // findAddressById (cross-feature)
  // ═══════════════════════════════════════════

  describe('findAddressById', () => {
    it('should return address when found for user', async () => {
      // Arrange
      const address = mockAddress({ id: 5, user_id: 1 });
      addressRepository.findByIdAndUserId.mockResolvedValue(address);

      // Act
      const result = await service.findAddressById(1, 5);

      // Assert
      expect(addressRepository.findByIdAndUserId).toHaveBeenCalledWith(5, 1);
      expect(result?.id).toBe(5);
    });

    it('should return null when address not found', async () => {
      // Arrange
      addressRepository.findByIdAndUserId.mockResolvedValue(null);

      // Act
      const result = await service.findAddressById(1, 99);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when address belongs to different user', async () => {
      // Arrange
      addressRepository.findByIdAndUserId.mockResolvedValue(null);

      // Act
      const result = await service.findAddressById(2, 1);

      // Assert
      expect(addressRepository.findByIdAndUserId).toHaveBeenCalledWith(1, 2);
      expect(result).toBeNull();
    });
  });

  // ═══════════════════════════════════════════
  // setDefaultAddress
  // ═══════════════════════════════════════════

  describe('setDefaultAddress', () => {
    it('should clear all defaults then set new default', async () => {
      // Arrange
      const address = mockAddress({ id: 3, user_id: 1 });
      addressRepository.findByIdAndUserId.mockResolvedValue(address);

      // Act
      const result = await service.setDefaultAddress(1, 3);

      // Assert
      expect(addressRepository.clearDefaultByUserId).toHaveBeenCalledWith(1);
      expect(addressRepository.setDefault).toHaveBeenCalledWith(3);
      expect(result.is_default).toBe(true);
    });

    it('should call clearDefault before setDefault', async () => {
      // Arrange
      const address = mockAddress({ id: 3, user_id: 1 });
      addressRepository.findByIdAndUserId.mockResolvedValue(address);
      const callOrder: string[] = [];
      addressRepository.clearDefaultByUserId.mockImplementation(async () => {
        callOrder.push('clear');
      });
      addressRepository.setDefault.mockImplementation(async () => {
        callOrder.push('set');
      });

      // Act
      await service.setDefaultAddress(1, 3);

      // Assert
      expect(callOrder).toEqual(['clear', 'set']);
    });

    it('should throw NotFoundException if address not found', async () => {
      // Arrange
      addressRepository.findByIdAndUserId.mockResolvedValue(null);

      // Act & Assert
      await expect(service.setDefaultAddress(1, 99)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should include COMMON_001 error code when address not found', async () => {
      // Arrange
      addressRepository.findByIdAndUserId.mockResolvedValue(null);

      // Act & Assert
      try {
        await service.setDefaultAddress(1, 99);
        fail('Should have thrown');
      } catch (e: any) {
        expect(e.getResponse()).toEqual(
          expect.objectContaining({ code: 'COMMON_001' }),
        );
      }
    });

    it('should not call clearDefault or setDefault when address not found', async () => {
      // Arrange
      addressRepository.findByIdAndUserId.mockResolvedValue(null);

      // Act
      try {
        await service.setDefaultAddress(1, 99);
      } catch {}

      // Assert
      expect(addressRepository.clearDefaultByUserId).not.toHaveBeenCalled();
      expect(addressRepository.setDefault).not.toHaveBeenCalled();
    });

    it('should return address with is_default set to true', async () => {
      // Arrange
      const address = mockAddress({ id: 3, user_id: 1, is_default: false });
      addressRepository.findByIdAndUserId.mockResolvedValue(address);

      // Act
      const result = await service.setDefaultAddress(1, 3);

      // Assert
      expect(result.is_default).toBe(true);
      expect(result.id).toBe(3);
    });
  });
});
