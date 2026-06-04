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
      const payload: IJwtPayload = { sub: 1, roleId: 1 };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        id: 1,
        roleId: 1,
      });
    });

    it('should map admin role correctly', () => {
      const payload: IJwtPayload = { sub: 10, roleId: 2 };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        id: 10,
        roleId: 2,
      });
    });
  });
});
