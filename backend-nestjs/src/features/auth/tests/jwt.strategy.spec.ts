import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { IJwtPayload } from '../types/auth.types';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-jwt-secret'),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  describe('validate', () => {
    it('should map JWT payload to ICurrentUser', () => {
      const payload: IJwtPayload = { sub: 1, email: 'user@example.com', role: 'customer' };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        id: 1,
        email: 'user@example.com',
        role: 'customer',
      });
    });

    it('should map admin role correctly', () => {
      const payload: IJwtPayload = { sub: 10, email: 'admin@example.com', role: 'admin' };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        id: 10,
        email: 'admin@example.com',
        role: 'admin',
      });
    });
  });
});
