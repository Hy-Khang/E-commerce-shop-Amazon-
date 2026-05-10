import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from '../entities/address.entity';

@Injectable()
export class AddressRepository {
  constructor(
    @InjectRepository(Address)
    private readonly repo: Repository<Address>,
  ) {}

  async findAllByUserId(userId: number): Promise<Address[]> {
    return this.repo.find({
      where: { user_id: userId },
      order: { is_default: 'DESC', id: 'ASC' },
    });
  }

  async findByIdAndUserId(id: number, userId: number): Promise<Address | null> {
    return this.repo.findOne({ where: { id, user_id: userId } });
  }

  async create(data: Partial<Address>): Promise<Address> {
    const address = this.repo.create(data);
    return this.repo.save(address);
  }

  async update(id: number, data: Partial<Address>): Promise<Address | null> {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  async clearDefaultByUserId(userId: number): Promise<void> {
    await this.repo.update({ user_id: userId }, { is_default: false });
  }

  async setDefault(id: number): Promise<void> {
    await this.repo.update(id, { is_default: true });
  }
}
