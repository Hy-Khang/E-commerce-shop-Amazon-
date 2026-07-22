import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAuthProvider } from '../entities/user-auth-provider.entity';

@Injectable()
export class UserAuthProviderRepository {
  constructor(
    @InjectRepository(UserAuthProvider)
    private readonly repo: Repository<UserAuthProvider>,
  ) {}

  async findByProviderAndProviderId(
    provider: string,
    providerId: string,
  ): Promise<UserAuthProvider | null> {
    return this.repo.findOne({
      where: { provider, provider_id: providerId },
      relations: ['user', 'user.role'],
    });
  }

  async findByUserId(userId: number): Promise<UserAuthProvider[]> {
    return this.repo.find({ where: { user_id: userId } });
  }

  async getProviderNamesByUserId(userId: number): Promise<string[]> {
    const providers = await this.repo.find({
      where: { user_id: userId },
      select: ['provider'],
    });
    return providers.map((p) => p.provider);
  }

  async linkProvider(
    userId: number,
    provider: string,
    providerId: string,
  ): Promise<UserAuthProvider> {
    const entity = this.repo.create({
      user_id: userId,
      provider,
      provider_id: providerId,
    });
    return this.repo.save(entity);
  }

  async hasProvider(userId: number, provider: string): Promise<boolean> {
    return this.repo.exists({ where: { user_id: userId, provider } });
  }
}
