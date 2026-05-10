import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ProductService } from '../product.service';
import { CategoryRepository } from '../repositories/category.repository';
import { ProductRepository } from '../repositories/product.repository';
import { ProductVariantRepository } from '../repositories/product-variant.repository';
import { ProductImageRepository } from '../repositories/product-image.repository';

describe('ProductService', () => {
  let service: ProductService;
  let categoryRepository: jest.Mocked<CategoryRepository>;
  let productRepository: jest.Mocked<ProductRepository>;
  let productVariantRepository: jest.Mocked<ProductVariantRepository>;
  let productImageRepository: jest.Mocked<ProductImageRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: CategoryRepository,
          useValue: {
            findTree: jest.fn(),
            findBySlug: jest.fn(),
            findById: jest.fn(),
            findAllPaginated: jest.fn(),
            findByIdWithDetails: jest.fn(),
            existsBySlug: jest.fn(),
            existsBySlugExcludingId: jest.fn(),
            hasProductsOrChildren: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: ProductRepository,
          useValue: {
            findBySlug: jest.fn(),
            findById: jest.fn(),
            findActivePaginated: jest.fn(),
            findAllPaginated: jest.fn(),
            findByIdWithReviewStats: jest.fn(),
            findProductsByCategoryId: jest.fn(),
            existsBySlug: jest.fn(),
            existsBySlugExcludingId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updateIsActive: jest.fn(),
          },
        },
        {
          provide: ProductVariantRepository,
          useValue: {
            findById: jest.fn(),
            existsBySku: jest.fn(),
            existsBySkuExcludingId: jest.fn(),
            hasActiveCartItems: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            deductStock: jest.fn(),
            restoreStock: jest.fn(),
          },
        },
        {
          provide: ProductImageRepository,
          useValue: {
            findById: jest.fn(),
            create: jest.fn(),
            updateSortOrder: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    categoryRepository = module.get(CategoryRepository);
    productRepository = module.get(ProductRepository);
    productVariantRepository = module.get(ProductVariantRepository);
    productImageRepository = module.get(ProductImageRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findProductBySlug', () => {
    it('should return product when found', async () => {
      const product = { id: 1, name: 'Test', slug: 'test' } as any;
      productRepository.findBySlug.mockResolvedValue(product);

      const result = await service.findProductBySlug('test');
      expect(result).toEqual(product);
    });

    it('should throw NotFoundException when product not found', async () => {
      productRepository.findBySlug.mockResolvedValue(null);

      await expect(service.findProductBySlug('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createProduct', () => {
    it('should create product with valid data', async () => {
      const dto = { name: 'Test', slug: 'test', category_id: 1 };
      const product = { id: 1, ...dto } as any;

      productRepository.existsBySlug.mockResolvedValue(false);
      categoryRepository.findById.mockResolvedValue({ id: 1 } as any);
      productRepository.create.mockResolvedValue(product);

      const result = await service.createProduct(dto as any);
      expect(result).toEqual(product);
    });

    it('should throw ConflictException on duplicate slug', async () => {
      productRepository.existsBySlug.mockResolvedValue(true);

      await expect(
        service.createProduct({ name: 'Test', slug: 'test', category_id: 1 } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteCategory', () => {
    it('should throw BadRequestException when category has products or children', async () => {
      categoryRepository.findById.mockResolvedValue({ id: 1 } as any);
      categoryRepository.hasProductsOrChildren.mockResolvedValue(true);

      await expect(service.deleteCategory(1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteVariant', () => {
    it('should throw BadRequestException when variant has active cart items', async () => {
      productVariantRepository.findById.mockResolvedValue({ id: 1, sku: 'TST-001' } as any);
      productVariantRepository.hasActiveCartItems.mockResolvedValue(true);

      await expect(service.deleteVariant(1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('handleOrderCreated', () => {
    it('should deduct stock for each item', async () => {
      productVariantRepository.deductStock.mockResolvedValue(true);

      await service.handleOrderCreated({
        orderId: 1,
        items: [
          { productVariantId: 1, quantity: 2 },
          { productVariantId: 2, quantity: 1 },
        ],
      });

      expect(productVariantRepository.deductStock).toHaveBeenCalledTimes(2);
      expect(productVariantRepository.deductStock).toHaveBeenCalledWith(1, 2);
      expect(productVariantRepository.deductStock).toHaveBeenCalledWith(2, 1);
    });
  });
});
