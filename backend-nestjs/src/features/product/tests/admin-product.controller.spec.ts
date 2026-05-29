import { Test, TestingModule } from '@nestjs/testing';
import { AdminProductController } from '../admin-product.controller';
import { ProductService } from '../product.service';
import {
  mockProduct,
  mockProductWithReviewStats,
  mockProductVariant,
  mockProductImage,
  mockPaginatedProducts,
} from './mocks/product.mock';

describe('AdminProductController', () => {
  let controller: AdminProductController;
  let service: jest.Mocked<ProductService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminProductController],
      providers: [
        {
          provide: ProductService,
          useValue: {
            findAllProducts: jest.fn(),
            findProductById: jest.fn(),
            createProduct: jest.fn(),
            updateProduct: jest.fn(),
            toggleProductActive: jest.fn(),
            addVariant: jest.fn(),
            updateVariant: jest.fn(),
            deleteVariant: jest.fn(),
            addImage: jest.fn(),
            updateImageSortOrder: jest.fn(),
            deleteImage: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AdminProductController>(AdminProductController);
    service = module.get(ProductService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── Products ───

  describe('findAll', () => {
    it('should call service.findAllProducts with query', async () => {
      const paginated = mockPaginatedProducts();
      service.findAllProducts.mockResolvedValue(paginated);
      const query = { page: 1, limit: 20 } as any;

      const result = await controller.findAll(query);

      expect(result).toEqual(paginated);
      expect(service.findAllProducts).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should call service.findProductById with id', async () => {
      const product = mockProductWithReviewStats();
      service.findProductById.mockResolvedValue(product);

      const result = await controller.findOne(1);

      expect(result).toEqual(product);
      expect(service.findProductById).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should call service.createProduct with dto', async () => {
      const dto = { name: 'New', slug: 'new', category_id: 1 } as any;
      const product = mockProduct({ name: 'New', slug: 'new' });
      service.createProduct.mockResolvedValue(product);

      const result = await controller.create(dto);

      expect(result).toEqual(product);
      expect(service.createProduct).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should call service.updateProduct with id and dto', async () => {
      const dto = { name: 'Updated' } as any;
      const product = mockProduct({ name: 'Updated' });
      service.updateProduct.mockResolvedValue(product);

      const result = await controller.update(1, dto);

      expect(result).toEqual(product);
      expect(service.updateProduct).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('toggleActivate', () => {
    it('should call service.toggleProductActive with id', async () => {
      const product = mockProduct({ is_active: false });
      service.toggleProductActive.mockResolvedValue(product);

      const result = await controller.toggleActivate(1);

      expect(result).toEqual(product);
      expect(service.toggleProductActive).toHaveBeenCalledWith(1);
    });
  });

  // ─── Variants ───

  describe('addVariant', () => {
    it('should call service.addVariant with product id and dto', async () => {
      const dto = { sku: 'NEW-001', price: 100000 } as any;
      const variant = mockProductVariant({ sku: 'NEW-001' });
      service.addVariant.mockResolvedValue(variant);

      const result = await controller.addVariant(1, dto);

      expect(result).toEqual(variant);
      expect(service.addVariant).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('updateVariant', () => {
    it('should call service.updateVariant with id and dto', async () => {
      const dto = { price: 350000 } as any;
      const variant = mockProductVariant({ price: 350000 });
      service.updateVariant.mockResolvedValue(variant);

      const result = await controller.updateVariant(1, dto);

      expect(result).toEqual(variant);
      expect(service.updateVariant).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('deleteVariant', () => {
    it('should call service.deleteVariant with id', async () => {
      service.deleteVariant.mockResolvedValue(undefined);

      await controller.deleteVariant(1);

      expect(service.deleteVariant).toHaveBeenCalledWith(1);
    });
  });

  // ─── Images ───

  describe('addImage', () => {
    it('should call service.addImage with product id and dto', async () => {
      const dto = { image_url: 'https://cdn.example.com/new.jpg', sort_order: 0 } as any;
      const image = mockProductImage({ image_url: dto.image_url });
      service.addImage.mockResolvedValue(image);

      const result = await controller.addImage(1, dto);

      expect(result).toEqual(image);
      expect(service.addImage).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('updateImage', () => {
    it('should call service.updateImageSortOrder with id and dto', async () => {
      const dto = { sort_order: 5 } as any;
      const image = mockProductImage({ sort_order: 5 });
      service.updateImageSortOrder.mockResolvedValue(image);

      const result = await controller.updateImage(1, dto);

      expect(result).toEqual(image);
      expect(service.updateImageSortOrder).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('deleteImage', () => {
    it('should call service.deleteImage with id', async () => {
      service.deleteImage.mockResolvedValue(undefined);

      await controller.deleteImage(1);

      expect(service.deleteImage).toHaveBeenCalledWith(1);
    });
  });
});
