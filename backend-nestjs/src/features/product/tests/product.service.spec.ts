import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ProductService } from '../product.service';
import { CategoryRepository } from '../repositories/category.repository';
import { ProductRepository } from '../repositories/product.repository';
import { ProductVariantRepository } from '../repositories/product-variant.repository';
import { ProductImageRepository } from '../repositories/product-image.repository';
import {
  mockCategory,
  mockCategoryWithChildren,
  mockProduct,
  mockProductWithReviewStats,
  mockProductVariant,
  mockProductImage,
  mockPaginatedProducts,
  mockPaginatedCategories,
} from './mocks/product.mock';

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
            findDescendantIds: jest.fn(),
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
            findProductsByCategoryIds: jest.fn(),
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
            update: jest.fn(),
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

  // ─── Public: Categories ───

  describe('getCategoryTree', () => {
    it('should return category tree from repository', async () => {
      const tree = [mockCategoryWithChildren()];
      categoryRepository.findTree.mockResolvedValue(tree);

      const result = await service.getCategoryTree();

      expect(result).toEqual(tree);
      expect(categoryRepository.findTree).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCategoryBySlug', () => {
    it('should return category with paginated products including descendants', async () => {
      const category = mockCategory();
      const products = mockPaginatedProducts();
      categoryRepository.findBySlug.mockResolvedValue(category);
      categoryRepository.findDescendantIds.mockResolvedValue([1, 2, 3]);
      productRepository.findProductsByCategoryIds.mockResolvedValue(products);

      const result = await service.getCategoryBySlug('electronics', 1, 20);

      expect(result.category).toEqual(category);
      expect(result.products).toEqual(products);
      expect(categoryRepository.findDescendantIds).toHaveBeenCalledWith(1);
      expect(productRepository.findProductsByCategoryIds).toHaveBeenCalledWith([1, 2, 3], 1, 20);
    });

    it('should throw NotFoundException when category not found', async () => {
      categoryRepository.findBySlug.mockResolvedValue(null);

      await expect(service.getCategoryBySlug('nonexistent', 1, 20)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── Public: Products ───

  describe('findActiveProducts', () => {
    it('should return paginated active products', async () => {
      const paginated = mockPaginatedProducts();
      productRepository.findActivePaginated.mockResolvedValue(paginated);
      const query = { page: 1, limit: 20 } as any;

      const result = await service.findActiveProducts(query);

      expect(result).toEqual(paginated);
      expect(productRepository.findActivePaginated).toHaveBeenCalledWith(query);
    });
  });

  describe('findProductBySlug', () => {
    it('should return product when found', async () => {
      const product = mockProduct();
      productRepository.findBySlug.mockResolvedValue(product);

      const result = await service.findProductBySlug('wireless-headphones');

      expect(result).toEqual(product);
    });

    it('should throw NotFoundException when product not found', async () => {
      productRepository.findBySlug.mockResolvedValue(null);

      await expect(service.findProductBySlug('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── Admin: Categories ───

  describe('findAllCategories', () => {
    it('should return paginated categories', async () => {
      const paginated = mockPaginatedCategories();
      categoryRepository.findAllPaginated.mockResolvedValue(paginated);
      const query = { page: 1, limit: 20 } as any;

      const result = await service.findAllCategories(query);

      expect(result).toEqual(paginated);
    });
  });

  describe('findCategoryById', () => {
    it('should return category with details', async () => {
      const category = mockCategoryWithChildren();
      categoryRepository.findByIdWithDetails.mockResolvedValue(category);

      const result = await service.findCategoryById(1);

      expect(result).toEqual(category);
    });

    it('should throw NotFoundException when category not found', async () => {
      categoryRepository.findByIdWithDetails.mockResolvedValue(null);

      await expect(service.findCategoryById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createCategory', () => {
    const dto = { name: 'Phones', slug: 'phones' } as any;

    it('should create category successfully', async () => {
      const created = mockCategory({ id: 2, name: 'Phones', slug: 'phones' });
      categoryRepository.existsBySlug.mockResolvedValue(false);
      categoryRepository.create.mockResolvedValue(created);

      const result = await service.createCategory(dto);

      expect(result).toEqual(created);
    });

    it('should throw ConflictException on duplicate slug', async () => {
      categoryRepository.existsBySlug.mockResolvedValue(true);

      await expect(service.createCategory(dto)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when parent_id does not exist', async () => {
      const dtoWithParent = { ...dto, parent_id: 999 };
      categoryRepository.existsBySlug.mockResolvedValue(false);
      categoryRepository.findById.mockResolvedValue(null);

      await expect(service.createCategory(dtoWithParent)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should create category with valid parent_id', async () => {
      const dtoWithParent = { ...dto, parent_id: 1 };
      const parent = mockCategory();
      const created = mockCategory({ id: 2, name: 'Phones', slug: 'phones', parent_id: 1 });
      categoryRepository.existsBySlug.mockResolvedValue(false);
      categoryRepository.findById.mockResolvedValue(parent);
      categoryRepository.create.mockResolvedValue(created);

      const result = await service.createCategory(dtoWithParent);

      expect(result).toEqual(created);
      expect(categoryRepository.findById).toHaveBeenCalledWith(1);
    });
  });

  describe('updateCategory', () => {
    const existingCategory = mockCategory();

    it('should update category successfully', async () => {
      const dto = { name: 'Updated' } as any;
      const updated = mockCategory({ name: 'Updated' });
      categoryRepository.findById.mockResolvedValue(existingCategory);
      categoryRepository.update.mockResolvedValue(updated);

      const result = await service.updateCategory(1, dto);

      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when category not found', async () => {
      categoryRepository.findById.mockResolvedValue(null);

      await expect(service.updateCategory(999, {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException on duplicate slug', async () => {
      const dto = { slug: 'existing-slug' } as any;
      categoryRepository.findById.mockResolvedValue(existingCategory);
      categoryRepository.existsBySlugExcludingId.mockResolvedValue(true);

      await expect(service.updateCategory(1, dto)).rejects.toThrow(ConflictException);
    });

    it('should skip slug check when slug unchanged', async () => {
      const dto = { slug: 'electronics' } as any;
      const updated = mockCategory();
      categoryRepository.findById.mockResolvedValue(existingCategory);
      categoryRepository.update.mockResolvedValue(updated);

      await service.updateCategory(1, dto);

      expect(categoryRepository.existsBySlugExcludingId).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when parent_id is self', async () => {
      const dto = { parent_id: 1 } as any;
      const category = mockCategory({ id: 1, parent_id: null as any });
      categoryRepository.findById.mockResolvedValue(category);

      await expect(service.updateCategory(1, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when new parent does not exist', async () => {
      const dto = { parent_id: 999 } as any;
      categoryRepository.findById
        .mockResolvedValueOnce(existingCategory)
        .mockResolvedValueOnce(null);

      await expect(service.updateCategory(1, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      categoryRepository.findById.mockResolvedValue(mockCategory());
      categoryRepository.hasProductsOrChildren.mockResolvedValue(false);
      categoryRepository.delete.mockResolvedValue(undefined);

      await service.deleteCategory(1);

      expect(categoryRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when category not found', async () => {
      categoryRepository.findById.mockResolvedValue(null);

      await expect(service.deleteCategory(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when category has products or children', async () => {
      categoryRepository.findById.mockResolvedValue(mockCategory());
      categoryRepository.hasProductsOrChildren.mockResolvedValue(true);

      await expect(service.deleteCategory(1)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Admin: Products ───

  describe('findAllProducts', () => {
    it('should return paginated products including inactive', async () => {
      const paginated = mockPaginatedProducts();
      productRepository.findAllPaginated.mockResolvedValue(paginated);
      const query = { page: 1, limit: 20 } as any;

      const result = await service.findAllProducts(query);

      expect(result).toEqual(paginated);
    });
  });

  describe('findProductById', () => {
    it('should return product with review stats', async () => {
      const product = mockProductWithReviewStats();
      productRepository.findByIdWithReviewStats.mockResolvedValue(product);

      const result = await service.findProductById(1);

      expect(result).toEqual(product);
      expect(result.reviewCount).toBe(10);
      expect(result.avgRating).toBe(4.5);
    });

    it('should throw NotFoundException when product not found', async () => {
      productRepository.findByIdWithReviewStats.mockResolvedValue(null);

      await expect(service.findProductById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createProduct', () => {
    const dto = { name: 'New Product', slug: 'new-product', category_id: 1 } as any;

    it('should create product successfully', async () => {
      const created = mockProduct({ id: 2, name: 'New Product', slug: 'new-product' });
      productRepository.existsBySlug.mockResolvedValue(false);
      categoryRepository.findById.mockResolvedValue(mockCategory());
      productRepository.create.mockResolvedValue(created);

      const result = await service.createProduct(dto);

      expect(result).toEqual(created);
    });

    it('should throw ConflictException on duplicate slug', async () => {
      productRepository.existsBySlug.mockResolvedValue(true);

      await expect(service.createProduct(dto)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when category not found', async () => {
      productRepository.existsBySlug.mockResolvedValue(false);
      categoryRepository.findById.mockResolvedValue(null);

      await expect(service.createProduct(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProduct', () => {
    const existingProduct = mockProduct();

    it('should update product successfully', async () => {
      const dto = { name: 'Updated Product' } as any;
      const updated = mockProduct({ name: 'Updated Product' });
      productRepository.findById.mockResolvedValue(existingProduct);
      productRepository.update.mockResolvedValue(updated);

      const result = await service.updateProduct(1, dto);

      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when product not found', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(service.updateProduct(999, {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException on duplicate slug', async () => {
      const dto = { slug: 'taken-slug' } as any;
      productRepository.findById.mockResolvedValue(existingProduct);
      productRepository.existsBySlugExcludingId.mockResolvedValue(true);

      await expect(service.updateProduct(1, dto)).rejects.toThrow(ConflictException);
    });

    it('should skip slug check when slug unchanged', async () => {
      const dto = { slug: 'wireless-headphones' } as any;
      const updated = mockProduct();
      productRepository.findById.mockResolvedValue(existingProduct);
      productRepository.update.mockResolvedValue(updated);

      await service.updateProduct(1, dto);

      expect(productRepository.existsBySlugExcludingId).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when new category not found', async () => {
      const dto = { category_id: 999 } as any;
      productRepository.findById.mockResolvedValue(existingProduct);
      categoryRepository.findById.mockResolvedValue(null);

      await expect(service.updateProduct(1, dto)).rejects.toThrow(NotFoundException);
    });

    it('should skip category check when category_id unchanged', async () => {
      const dto = { category_id: 1 } as any;
      const updated = mockProduct();
      productRepository.findById.mockResolvedValue(existingProduct);
      productRepository.update.mockResolvedValue(updated);

      await service.updateProduct(1, dto);

      expect(categoryRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('toggleProductActive', () => {
    it('should toggle active product to inactive', async () => {
      const product = mockProduct({ is_active: true });
      productRepository.findById.mockResolvedValue(product);
      productRepository.updateIsActive.mockResolvedValue(undefined);

      const result = await service.toggleProductActive(1);

      expect(result.is_active).toBe(false);
      expect(productRepository.updateIsActive).toHaveBeenCalledWith(1, false);
    });

    it('should toggle inactive product to active', async () => {
      const product = mockProduct({ is_active: false });
      productRepository.findById.mockResolvedValue(product);
      productRepository.updateIsActive.mockResolvedValue(undefined);

      const result = await service.toggleProductActive(1);

      expect(result.is_active).toBe(true);
      expect(productRepository.updateIsActive).toHaveBeenCalledWith(1, true);
    });

    it('should throw NotFoundException when product not found', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(service.toggleProductActive(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Admin: Variants ───

  describe('addVariant', () => {
    const dto = { sku: 'NEW-SKU-001', option1: 'Red', option2: 'L', price: 300000, stock_quantity: 50 } as any;

    it('should add variant to product successfully', async () => {
      const variant = mockProductVariant({ id: 2, sku: 'NEW-SKU-001', product_id: 1 });
      productRepository.findById.mockResolvedValue(mockProduct());
      productVariantRepository.existsBySku.mockResolvedValue(false);
      productVariantRepository.create.mockResolvedValue(variant);

      const result = await service.addVariant(1, dto);

      expect(result).toEqual(variant);
      expect(productVariantRepository.create).toHaveBeenCalledWith({
        ...dto,
        product_id: 1,
      });
    });

    it('should throw NotFoundException when product not found', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(service.addVariant(999, dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on duplicate SKU', async () => {
      productRepository.findById.mockResolvedValue(mockProduct());
      productVariantRepository.existsBySku.mockResolvedValue(true);

      await expect(service.addVariant(1, dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('updateVariant', () => {
    const existingVariant = mockProductVariant();

    it('should update variant successfully', async () => {
      const dto = { price: 350000 } as any;
      const updated = mockProductVariant({ price: 350000 });
      productVariantRepository.findById.mockResolvedValue(existingVariant);
      productVariantRepository.update.mockResolvedValue(updated);

      const result = await service.updateVariant(1, dto);

      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when variant not found', async () => {
      productVariantRepository.findById.mockResolvedValue(null);

      await expect(service.updateVariant(999, {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException on duplicate SKU', async () => {
      const dto = { sku: 'TAKEN-SKU' } as any;
      productVariantRepository.findById.mockResolvedValue(existingVariant);
      productVariantRepository.existsBySkuExcludingId.mockResolvedValue(true);

      await expect(service.updateVariant(1, dto)).rejects.toThrow(ConflictException);
    });

    it('should skip SKU check when SKU unchanged', async () => {
      const dto = { sku: 'ELEC-BLK-M' } as any;
      const updated = mockProductVariant();
      productVariantRepository.findById.mockResolvedValue(existingVariant);
      productVariantRepository.update.mockResolvedValue(updated);

      await service.updateVariant(1, dto);

      expect(productVariantRepository.existsBySkuExcludingId).not.toHaveBeenCalled();
    });
  });

  describe('deleteVariant', () => {
    it('should delete variant successfully', async () => {
      productVariantRepository.findById.mockResolvedValue(mockProductVariant());
      productVariantRepository.hasActiveCartItems.mockResolvedValue(false);
      productVariantRepository.delete.mockResolvedValue(undefined);

      await service.deleteVariant(1);

      expect(productVariantRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when variant not found', async () => {
      productVariantRepository.findById.mockResolvedValue(null);

      await expect(service.deleteVariant(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when variant has active cart items', async () => {
      productVariantRepository.findById.mockResolvedValue(mockProductVariant());
      productVariantRepository.hasActiveCartItems.mockResolvedValue(true);

      await expect(service.deleteVariant(1)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Admin: Images ───

  describe('addImage', () => {
    const dto = { image_url: 'https://cdn.example.com/new.jpg', sort_order: 1 } as any;

    it('should add image to product successfully', async () => {
      const image = mockProductImage({ id: 2, image_url: dto.image_url, sort_order: 1 });
      productRepository.findById.mockResolvedValue(mockProduct());
      productImageRepository.create.mockResolvedValue(image);

      const result = await service.addImage(1, dto);

      expect(result).toEqual(image);
      expect(productImageRepository.create).toHaveBeenCalledWith({
        ...dto,
        product_id: 1,
      });
    });

    it('should throw NotFoundException when product not found', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(service.addImage(999, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateImage', () => {
    it('should update image sort order successfully', async () => {
      const image = mockProductImage();
      const updated = mockProductImage({ sort_order: 5 });
      productImageRepository.findById.mockResolvedValue(image);
      productImageRepository.update.mockResolvedValue(updated);

      const result = await service.updateImage(1, { sort_order: 5 } as any);

      expect(result).toEqual(updated);
      expect(productImageRepository.update).toHaveBeenCalledWith(1, { sort_order: 5 });
    });

    it('should update variant_option1 when explicitly set', async () => {
      const image = mockProductImage();
      const product = mockProduct({ variants: [mockProductVariant({ option1: 'Black' })] });
      const updated = mockProductImage({ variant_option1: 'Black' });
      productImageRepository.findById.mockResolvedValue(image);
      productRepository.findById.mockResolvedValue(product);
      productImageRepository.update.mockResolvedValue(updated);

      const result = await service.updateImage(1, { variant_option1: 'Black' } as any);

      expect(result).toEqual(updated);
      expect(productImageRepository.update).toHaveBeenCalledWith(1, { variant_option1: 'Black' });
    });

    it('should clear variant_option1 when set to null', async () => {
      const image = mockProductImage({ variant_option1: 'Black' });
      const updated = mockProductImage({ variant_option1: null });
      productImageRepository.findById.mockResolvedValue(image);
      productImageRepository.update.mockResolvedValue(updated);

      const dto = { variant_option1: null } as any;
      const result = await service.updateImage(1, dto);

      expect(result).toEqual(updated);
      expect(productImageRepository.update).toHaveBeenCalledWith(1, { variant_option1: null });
    });

    it('should throw NotFoundException when image not found', async () => {
      productImageRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateImage(999, { sort_order: 5 } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when variant_option1 does not match any variant', async () => {
      const image = mockProductImage();
      const product = mockProduct({ variants: [mockProductVariant({ option1: 'Black' })] });
      productImageRepository.findById.mockResolvedValue(image);
      productRepository.findById.mockResolvedValue(product);

      await expect(
        service.updateImage(1, { variant_option1: 'NonExistent' } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteImage', () => {
    it('should delete image successfully', async () => {
      productImageRepository.findById.mockResolvedValue(mockProductImage());
      productImageRepository.delete.mockResolvedValue(undefined);

      await service.deleteImage(1);

      expect(productImageRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when image not found', async () => {
      productImageRepository.findById.mockResolvedValue(null);

      await expect(service.deleteImage(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Cross-feature ───

  describe('findVariantById', () => {
    it('should return variant when found', async () => {
      const variant = mockProductVariant();
      productVariantRepository.findById.mockResolvedValue(variant);

      const result = await service.findVariantById(1);

      expect(result).toEqual(variant);
    });

    it('should return null when variant not found', async () => {
      productVariantRepository.findById.mockResolvedValue(null);

      const result = await service.findVariantById(999);

      expect(result).toBeNull();
    });
  });

  describe('findProductByIdPublic', () => {
    it('should return product when found', async () => {
      const product = mockProduct();
      productRepository.findById.mockResolvedValue(product);

      const result = await service.findProductByIdPublic(1);

      expect(result).toEqual(product);
    });

    it('should return null when product not found', async () => {
      productRepository.findById.mockResolvedValue(null);

      const result = await service.findProductByIdPublic(999);

      expect(result).toBeNull();
    });
  });

  // ─── Event Listeners ───

  describe('handleOrderCreated', () => {
    it('should deduct stock for each item', async () => {
      productVariantRepository.deductStock.mockResolvedValue(true);

      await service.handleOrderCreated({
        orderId: 1,
        items: [
          { productVariantId: 1, quantity: 2 },
          { productVariantId: 2, quantity: 3 },
        ],
      });

      expect(productVariantRepository.deductStock).toHaveBeenCalledTimes(2);
      expect(productVariantRepository.deductStock).toHaveBeenCalledWith(1, 2);
      expect(productVariantRepository.deductStock).toHaveBeenCalledWith(2, 3);
    });

    it('should not throw when stock deduction fails (logs warning instead)', async () => {
      productVariantRepository.deductStock.mockResolvedValue(false);

      await expect(
        service.handleOrderCreated({
          orderId: 1,
          items: [{ productVariantId: 1, quantity: 999 }],
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('handleOrderCancelled', () => {
    it('should restore stock for each item', async () => {
      productVariantRepository.restoreStock.mockResolvedValue(undefined);

      await service.handleOrderCancelled({
        orderId: 1,
        items: [
          { productVariantId: 1, quantity: 2 },
          { productVariantId: 2, quantity: 3 },
        ],
      });

      expect(productVariantRepository.restoreStock).toHaveBeenCalledTimes(2);
      expect(productVariantRepository.restoreStock).toHaveBeenCalledWith(1, 2);
      expect(productVariantRepository.restoreStock).toHaveBeenCalledWith(2, 3);
    });
  });
});
