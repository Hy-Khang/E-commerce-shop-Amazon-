import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { AddressRepository } from './repositories/address.repository';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Address } from './entities/address.entity';
import { IUserProfileResponse } from './types/user-profile.types';

@Injectable()
export class UserProfileService {
  private readonly logger = new Logger(UserProfileService.name);

  constructor(
    private readonly addressRepository: AddressRepository,
    private readonly authService: AuthService,
  ) {}

  async getProfile(userId: number): Promise<IUserProfileResponse> {
    const user = await this.authService.findUserById(userId);
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      is_active: user.is_active,
      created_at: user.created_at,
    };
  }

  async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<IUserProfileResponse> {
    const user = await this.authService.updateProfile(userId, dto);
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      is_active: user.is_active,
      created_at: user.created_at,
    };
  }

  async findAllAddresses(userId: number): Promise<Address[]> {
    return this.addressRepository.findAllByUserId(userId);
  }

  async createAddress(userId: number, dto: CreateAddressDto): Promise<Address> {
    if (dto.is_default) {
      await this.addressRepository.clearDefaultByUserId(userId);
    }

    const address = await this.addressRepository.create({
      user_id: userId,
      ...dto,
    });

    this.logger.log(`Address created for user ${userId}: ${address.id}`);
    return address;
  }

  async updateAddress(
    userId: number,
    id: number,
    dto: UpdateAddressDto,
  ): Promise<Address> {
    const address = await this.addressRepository.findByIdAndUserId(id, userId);
    if (!address) {
      throw new NotFoundException({
        code: 'COMMON_001',
        message: 'Address not found',
      });
    }

    if (dto.is_default) {
      await this.addressRepository.clearDefaultByUserId(userId);
    }

    const updated = await this.addressRepository.update(id, dto);
    return updated!;
  }

  async deleteAddress(userId: number, id: number): Promise<void> {
    const address = await this.addressRepository.findByIdAndUserId(id, userId);
    if (!address) {
      throw new NotFoundException({
        code: 'COMMON_001',
        message: 'Address not found',
      });
    }

    await this.addressRepository.delete(id);
    this.logger.log(`Address deleted for user ${userId}: ${id}`);
  }

  // ─── Cross-feature: consumed by order ───

  async findAddressById(
    userId: number,
    addressId: number,
  ): Promise<Address | null> {
    return this.addressRepository.findByIdAndUserId(addressId, userId);
  }

  async setDefaultAddress(userId: number, id: number): Promise<Address> {
    const address = await this.addressRepository.findByIdAndUserId(id, userId);
    if (!address) {
      throw new NotFoundException({
        code: 'COMMON_001',
        message: 'Address not found',
      });
    }

    await this.addressRepository.clearDefaultByUserId(userId);
    await this.addressRepository.setDefault(id);

    return { ...address, is_default: true };
  }
}
