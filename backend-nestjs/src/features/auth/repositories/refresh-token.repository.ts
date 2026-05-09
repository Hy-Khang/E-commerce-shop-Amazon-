import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';

@Injectable()
export class RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repo: Repository<RefreshToken>,
  ) {}

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.repo.findOne({
      where: { token_hash: tokenHash, is_revoked: false },
    });
  }

  async create(data: Partial<RefreshToken>): Promise<RefreshToken> {
    const token = this.repo.create(data);
    return this.repo.save(token);
  }

  async revokeByTokenHash(tokenHash: string): Promise<void> {
    await this.repo.update({ token_hash: tokenHash }, { is_revoked: true });
  }

  async revokeAllByUserId(userId: number): Promise<void> {
    await this.repo.update(
      { user_id: userId, is_revoked: false },
      { is_revoked: true },
    );
  }
}
