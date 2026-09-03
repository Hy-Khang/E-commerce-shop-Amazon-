import { Test, TestingModule } from '@nestjs/testing';
import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { UserProfileController } from '../user-profile.controller';
import { UserProfileService } from '../user-profile.service';
import {
  mockAddress,
  mockDefaultAddress,
  mockUserProfile,
} from './mocks/user-profile.mock';

class MockJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 1, email: 'test@example.com', role: 'customer' };
    return true;
  }
}

describe('UserProfile (e2e)', () => {
  let app: INestApplication;
  let service: jest.Mocked<UserProfileService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserProfileController],
      providers: [
        {
          provide: APP_GUARD,
          useClass: MockJwtGuard,
        },
        {
          provide: UserProfileService,
          useValue: {
            getProfile: jest.fn(),
            updateProfile: jest.fn(),
            findAllAddresses: jest.fn(),
            createAddress: jest.fn(),
            updateAddress: jest.fn(),
            deleteAddress: jest.fn(),
            setDefaultAddress: jest.fn(),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    service = module.get(UserProfileService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════
  // POST /addresses — create address validation
  // ═══════════════════════════════════════════

  describe('POST /addresses — validation', () => {
    it('should return 400 when full_name is missing', async () => {
      await request(app.getHttpServer())
        .post('/addresses')
        .send({ phone: '0901234567', address_line: '123 St', city: 'HCM' })
        .expect(400);
    });

    it('should return 400 when phone is missing', async () => {
      await request(app.getHttpServer())
        .post('/addresses')
        .send({ full_name: 'Test', address_line: '123 St', city: 'HCM' })
        .expect(400);
    });

    it('should return 400 when address_line is missing', async () => {
      await request(app.getHttpServer())
        .post('/addresses')
        .send({ full_name: 'Test', phone: '0901234567', city: 'HCM' })
        .expect(400);
    });

    it('should return 400 when city is missing', async () => {
      await request(app.getHttpServer())
        .post('/addresses')
        .send({
          full_name: 'Test',
          phone: '0901234567',
          address_line: '123 St',
        })
        .expect(400);
    });

    it('should return 400 for invalid Vietnamese phone number', async () => {
      await request(app.getHttpServer())
        .post('/addresses')
        .send({
          full_name: 'Test',
          phone: '1234567890',
          address_line: '123 St',
          city: 'HCM',
        })
        .expect(400);
    });

    it('should return 400 when unknown fields are sent (forbidNonWhitelisted)', async () => {
      await request(app.getHttpServer())
        .post('/addresses')
        .send({
          full_name: 'Test',
          phone: '0901234567',
          address_line: '123 St',
          city: 'HCM',
          user_id: 999,
        })
        .expect(400);
    });

    it('should accept valid address and return 201', async () => {
      // Arrange
      const address = mockAddress();
      service.createAddress.mockResolvedValue(address);

      // Act & Assert
      const res = await request(app.getHttpServer())
        .post('/addresses')
        .send({
          full_name: 'Nguyen Van A',
          phone: '0901234567',
          address_line: '123 Le Loi, Quan 1',
          city: 'Ho Chi Minh',
        })
        .expect(201);

      expect(res.body.id).toBe(1);
    });
  });

  // ═══════════════════════════════════════════
  // PATCH /users/me — update profile validation
  // ═══════════════════════════════════════════

  describe('PATCH /users/me — validation', () => {
    it('should return 400 for invalid phone format', async () => {
      await request(app.getHttpServer())
        .patch('/users/me')
        .send({ phone: 'not-a-phone' })
        .expect(400);
    });

    it('should return 400 when full_name exceeds max length', async () => {
      await request(app.getHttpServer())
        .patch('/users/me')
        .send({ full_name: 'A'.repeat(101) })
        .expect(400);
    });

    it('should accept valid partial update', async () => {
      // Arrange
      const profile = mockUserProfile({ full_name: 'Updated' });
      service.updateProfile.mockResolvedValue(profile);

      // Act & Assert
      const res = await request(app.getHttpServer())
        .patch('/users/me')
        .send({ full_name: 'Updated' })
        .expect(200);

      expect(res.body.full_name).toBe('Updated');
    });
  });

  // ═══════════════════════════════════════════
  // Address CRUD flow
  // ═══════════════════════════════════════════

  describe('Address CRUD flow', () => {
    it('should create address then list it', async () => {
      // Arrange — create
      const created = mockAddress({ id: 10 });
      service.createAddress.mockResolvedValue(created);

      // Act — create
      const createRes = await request(app.getHttpServer())
        .post('/addresses')
        .send({
          full_name: 'Nguyen Van A',
          phone: '0901234567',
          address_line: '123 Le Loi',
          city: 'Ho Chi Minh',
        })
        .expect(201);

      expect(createRes.body.id).toBe(10);

      // Arrange — list
      service.findAllAddresses.mockResolvedValue([created]);

      // Act — list
      const listRes = await request(app.getHttpServer())
        .get('/addresses')
        .expect(200);

      expect(listRes.body).toHaveLength(1);
      expect(listRes.body[0].id).toBe(10);
    });

    it('should set address as default', async () => {
      // Arrange
      const address = mockDefaultAddress({ id: 5 });
      service.setDefaultAddress.mockResolvedValue(address);

      // Act
      const res = await request(app.getHttpServer())
        .patch('/addresses/5/default')
        .expect(200);

      // Assert
      expect(res.body.is_default).toBe(true);
    });

    it('should delete address and return 204', async () => {
      // Arrange
      service.deleteAddress.mockResolvedValue(undefined);

      // Act & Assert
      await request(app.getHttpServer()).delete('/addresses/5').expect(204);

      expect(service.deleteAddress).toHaveBeenCalled();
    });
  });
});
