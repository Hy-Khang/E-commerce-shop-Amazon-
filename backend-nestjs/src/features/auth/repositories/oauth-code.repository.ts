import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { OAuthCode } from '../entities/oauth-code.entity';

@Injectable()
export class OAuthCodeRepository {
  constructor(
    @InjectRepository(OAuthCode)
    private readonly repo: Repository<OAuthCode>,
  ) {}

  async createCode(
    codeHash: string,
    userId: number,
    expiresAt: Date,
  ): Promise<OAuthCode> {
    const entity = this.repo.create({
      code_hash: codeHash,
      user_id: userId,
      expires_at: expiresAt,
    });
    return this.repo.save(entity);
  }

  async findAndDeleteByCodeHash(codeHash: string): Promise<OAuthCode | null> {
    const code = await this.repo.findOne({ where: { code_hash: codeHash } });
    if (!code) return null;
    await this.repo.delete(code.id);
    return code;
  }

  async cleanupExpired(): Promise<number> {
    const result = await this.repo.delete({
      expires_at: LessThan(new Date()),
    });
    return result.affected || 0;
  }
}
