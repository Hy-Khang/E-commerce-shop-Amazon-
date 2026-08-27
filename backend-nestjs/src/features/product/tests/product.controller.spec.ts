import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ProductController } from '../product.controller';
import { ProductService } from '../product.service';
import {
  mockCategory,
  mockCategoryWithChildren,
  mockProduct,
  mockPaginatedProducts,
} from './mocks/product.mock';

describe('ProductController', () => {
  let controller: ProductController;
  let service: jest.Mocked<ProductService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: {
            getCategoryTree: jest.fn(),
            getCategoryBySlug: jest.fn(),
            findActiveProducts: jest.fn(),
            findProductBySlug: jest.fn(),
          },
        },
      ],
    })
      // search-by-image route is rate-limited; stub the throttler guard so the
      // controller compiles without the ThrottlerModule wiring.
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProductController>(ProductController);
    service = module.get(ProductService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCategoryTree', () => {
    it('should call service.getCategoryTree and return result', async () => {
      const tree = [mockCategoryWithChildren()];
      service.getCategoryTree.mockResolvedValue(tree);

      const result = await controller.getCategoryTree();

      expect(result).toEqual(tree);
      expect(service.getCategoryTree).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCategoryBySlug', () => {
    it('should call service with slug and pagination', async () => {
      const response = {
        category: mockCategory(),
        products: mockPaginatedProducts(),
      };
      service.getCategoryBySlug.mockResolvedValue(response);

      const result = await controller.getCategoryBySlug('electronics', {
        page: 1,
        limit: 20,
      } as any);

      expect(result).toEqual(response);
      expect(service.getCategoryBySlug).toHaveBeenCalledWith('electronics', 1, 20);
    });
  });

  describe('findAll', () => {
    it('should call service.findActiveProducts with query', async () => {
      const paginated = mockPaginatedProducts();
      service.findActiveProducts.mockResolvedValue(paginated);
      const query = { page: 1, limit: 20 } as any;

      const result = await controller.findAll(query);

      expect(result).toEqual(paginated);
      expect(service.findActiveProducts).toHaveBeenCalledWith(query);
    });
  });

  describe('findBySlug', () => {
    it('should call service.findProductBySlug with slug', async () => {
      const product = mockProduct();
      service.findProductBySlug.mockResolvedValue(product);

      const result = await controller.findBySlug('wireless-headphones');

      expect(result).toEqual(product);
      expect(service.findProductBySlug).toHaveBeenCalledWith('wireless-headphones');
    });
  });
});
