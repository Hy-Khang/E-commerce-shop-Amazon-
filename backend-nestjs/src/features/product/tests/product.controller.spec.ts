import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from '../product.controller';
import { ProductService } from '../product.service';

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
    }).compile();

    controller = module.get<ProductController>(ProductController);
    service = module.get(ProductService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCategoryTree', () => {
    it('should return category tree', async () => {
      const categories = [{ id: 1, name: 'Electronics', children: [] }] as any;
      service.getCategoryTree.mockResolvedValue(categories);

      const result = await controller.getCategoryTree();
      expect(result).toEqual(categories);
      expect(service.getCategoryTree).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const response = {
        data: [{ id: 1, name: 'Product' }],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      } as any;
      service.findActiveProducts.mockResolvedValue(response);

      const result = await controller.findAll({ page: 1, limit: 20 } as any);
      expect(result).toEqual(response);
    });
  });

  describe('findBySlug', () => {
    it('should return product by slug', async () => {
      const product = { id: 1, name: 'Test', slug: 'test' } as any;
      service.findProductBySlug.mockResolvedValue(product);

      const result = await controller.findBySlug('test');
      expect(result).toEqual(product);
    });
  });
});
