import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FlashSaleService } from '../flash-sale.service';
import { FlashSaleRepository } from '../repositories/flash-sale.repository';
import { FlashSaleItemRepository } from '../repositories/flash-sale-item.repository';
import { ProductService } from '../../product/product.service';
import { ShopService } from '../../shop/shop.service';

const SHOP = { id: 1, user_id: 9, status: 'active' };

/** A campaign whose registration window is open right now (scheduled). */
function openCampaign(overrides: Record<string, any> = {}) {
  const now = Date.now();
  return {
    id: 1,
    name: 'Camp',
    status: 'scheduled',
    registration_starts_at: new Date(now - 3600_000),
    registration_ends_at: new Date(now + 3600_000),
    starts_at: new Date(now + 7200_000),
    ends_at: new Date(now + 10800_000),
    min_discount_percent: 10,
    ...overrides,
  };
}

describe('FlashSaleService', () => {
  let service: FlashSaleService;
  let saleRepo: any;
  let itemRepo: any;
  let productService: any;
  let shopService: any;
  let eventEmitter: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    saleRepo = {
      findById: jest.fn(),
      findByIdWithProducts: jest.fn(),
      findByIdPublic: jest.fn(),
      findAllPaginated: jest.fn(),
      findActiveWithProducts: jest.fn(),
      findOpenForRegistration: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    itemRepo = {
      findById: jest.fn(),
      findByIdWithRelations: jest.fn(),
      findByCampaignId: jest.fn(),
      findRegistrationsPaginated: jest.fn(),
      existsInSale: jest.fn().mockResolvedValue(false),
      hasOverlappingItem: jest.fn().mockResolvedValue(false),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findActiveByVariantIds: jest.fn().mockResolvedValue([]),
      consume: jest.fn(),
      reverse: jest.fn(),
    };
    productService = { findVariantById: jest.fn() };
    shopService = {
      resolveShopByUserId: jest.fn().mockResolvedValue(SHOP),
      assertShopIsActive: jest.fn(),
    };
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlashSaleService,
        { provide: FlashSaleRepository, useValue: saleRepo },
        { provide: FlashSaleItemRepository, useValue: itemRepo },
        { provide: ProductService, useValue: productService },
        { provide: ShopService, useValue: shopService },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get(FlashSaleService);
  });

  describe('getActiveFlashPriceMap', () => {
    it('maps variant → flash price + remaining, earliest-start wins on dupes', async () => {
      itemRepo.findActiveByVariantIds.mockResolvedValue([
        {
          item_id: 10,
          product_variant_id: 1,
          flash_price: 149000,
          flash_quantity: 30,
          sold_quantity: 8,
        },
        {
          item_id: 99,
          product_variant_id: 1,
          flash_price: 100000,
          flash_quantity: 5,
          sold_quantity: 0,
        },
        {
          item_id: 11,
          product_variant_id: 2,
          flash_price: 199000,
          flash_quantity: 10,
          sold_quantity: 10,
        },
      ]);

      const map = await service.getActiveFlashPriceMap([1, 2, 3]);

      expect(map.get(1)).toEqual({
        flashItemId: 10,
        flashPrice: 149000,
        remaining: 22,
      });
      expect(map.get(2)).toEqual({
        flashItemId: 11,
        flashPrice: 199000,
        remaining: 0,
      });
      expect(map.has(3)).toBe(false);
    });

    it('returns an empty map for no variant ids', async () => {
      const map = await service.getActiveFlashPriceMap([]);
      expect(map.size).toBe(0);
      expect(itemRepo.findActiveByVariantIds).not.toHaveBeenCalled();
    });
  });

  describe('consume', () => {
    it('throws FLASH_SALE_006 when the atomic reserve fails (oversell)', async () => {
      itemRepo.consume.mockResolvedValue(false);
      await expect(service.consume(5, 3, {} as any)).rejects.toMatchObject({
        response: { code: 'FLASH_SALE_006' },
      });
    });

    it('passes through when the reserve succeeds', async () => {
      itemRepo.consume.mockResolvedValue(true);
      await expect(service.consume(5, 3, {} as any)).resolves.toBeUndefined();
    });
  });

  describe('createCampaign', () => {
    it('rejects a window where registration_ends_at > starts_at (FLASH_SALE_003)', async () => {
      const now = Date.now();
      await expect(
        service.createCampaign({
          name: 'X',
          registration_starts_at: new Date(now).toISOString(),
          registration_ends_at: new Date(now + 5 * 3600_000).toISOString(),
          starts_at: new Date(now + 3600_000).toISOString(),
          ends_at: new Date(now + 10 * 3600_000).toISOString(),
          min_discount_percent: 10,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(saleRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('registerItem', () => {
    beforeEach(() => {
      saleRepo.findById.mockResolvedValue(openCampaign());
      productService.findVariantById.mockResolvedValue({
        id: 7,
        price: 100000,
        product: { shop_id: 1, name: 'P' },
      });
    });

    it('rejects when the campaign is not open for registration (FLASH_SALE_009)', async () => {
      saleRepo.findById.mockResolvedValue(openCampaign({ status: 'active' }));
      await expect(
        service.registerItem(9, 1, {
          product_variant_id: 7,
          flash_price: 80000,
          flash_quantity: 5,
        }),
      ).rejects.toMatchObject({ response: { code: 'FLASH_SALE_009' } });
    });

    it('rejects a variant not owned by the shop (FLASH_SALE_010)', async () => {
      productService.findVariantById.mockResolvedValue({
        id: 7,
        price: 100000,
        product: { shop_id: 2, name: 'P' },
      });
      await expect(
        service.registerItem(9, 1, {
          product_variant_id: 7,
          flash_price: 80000,
          flash_quantity: 5,
        }),
      ).rejects.toMatchObject({ response: { code: 'FLASH_SALE_010' } });
    });

    it('rejects a flash price below the discount floor (FLASH_SALE_011)', async () => {
      await expect(
        service.registerItem(9, 1, {
          product_variant_id: 7,
          flash_price: 95000,
          flash_quantity: 5,
        }),
      ).rejects.toMatchObject({ response: { code: 'FLASH_SALE_011' } });
    });

    it('rejects a duplicate non-rejected registration (FLASH_SALE_004)', async () => {
      itemRepo.existsInSale.mockResolvedValue(true);
      await expect(
        service.registerItem(9, 1, {
          product_variant_id: 7,
          flash_price: 80000,
          flash_quantity: 5,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(itemRepo.create).not.toHaveBeenCalled();
    });

    it('creates a pending registration when valid', async () => {
      itemRepo.create.mockResolvedValue({ id: 42 });
      itemRepo.findByIdWithRelations.mockResolvedValue({
        id: 42,
        shop_id: 1,
        status: 'pending',
        flash_price: 80000,
        flash_quantity: 5,
        sold_quantity: 0,
        product_variant: { price: 100000, product: { id: 3, name: 'P' } },
      });

      await service.registerItem(9, 1, {
        product_variant_id: 7,
        flash_price: 80000,
        flash_quantity: 5,
      });

      expect(itemRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          shop_id: 1,
          status: 'pending',
          created_by: 9,
        }),
      );
    });
  });

  describe('approveItem', () => {
    const item = {
      id: 42,
      flash_sale_id: 1,
      shop_id: 1,
      product_variant_id: 7,
      status: 'pending',
      flash_sale: { name: 'Camp', starts_at: new Date(), ends_at: new Date() },
      shop: { user_id: 9 },
      product_variant: { product: { name: 'P' } },
    };

    it('rejects an overlapping approved variant (FLASH_SALE_012)', async () => {
      itemRepo.findByIdWithRelations.mockResolvedValue(item);
      itemRepo.hasOverlappingItem.mockResolvedValue(true);
      await expect(service.approveItem(42, 1)).rejects.toMatchObject({
        response: { code: 'FLASH_SALE_012' },
      });
      expect(itemRepo.update).not.toHaveBeenCalled();
    });

    it('approves a pending item and emits the reviewed event', async () => {
      itemRepo.findByIdWithRelations.mockResolvedValue(item);
      itemRepo.hasOverlappingItem.mockResolvedValue(false);
      await service.approveItem(42, 1);
      expect(itemRepo.update).toHaveBeenCalledWith(
        42,
        expect.objectContaining({ status: 'approved', reviewed_by: 1 }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'flash_sale.registration_reviewed',
        expect.objectContaining({ decision: 'approved', sellerUserId: 9 }),
      );
    });

    it('rejects approving a non-pending item (FLASH_SALE_013)', async () => {
      itemRepo.findByIdWithRelations.mockResolvedValue({
        ...item,
        status: 'approved',
      });
      await expect(service.approveItem(42, 1)).rejects.toMatchObject({
        response: { code: 'FLASH_SALE_013' },
      });
    });
  });

  describe('updateSellerItem', () => {
    it('rejects editing a non-pending registration (FLASH_SALE_013)', async () => {
      itemRepo.findByIdWithRelations.mockResolvedValue({
        id: 42,
        shop_id: 1,
        status: 'approved',
        product_variant: { price: 100000 },
        flash_sale: { min_discount_percent: 10 },
      });
      await expect(
        service.updateSellerItem(9, 42, { flash_price: 80000 }),
      ).rejects.toMatchObject({ response: { code: 'FLASH_SALE_013' } });
    });

    it('rejects a registration owned by another shop (FLASH_SALE_008)', async () => {
      itemRepo.findByIdWithRelations.mockResolvedValue({
        id: 42,
        shop_id: 2,
        status: 'pending',
      });
      await expect(
        service.updateSellerItem(9, 42, { flash_price: 80000 }),
      ).rejects.toMatchObject({ response: { code: 'FLASH_SALE_008' } });
    });
  });
});
