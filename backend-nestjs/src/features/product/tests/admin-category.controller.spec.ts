import { Test, TestingModule } from '@nestjs/testing';
import { AdminCategoryController } from '../admin-category.controller';
import { ProductService } from '../product.service';
import {
  mockCategory,
  mockCategoryWithChildren,
  mockPaginatedCategories,
} from './mocks/product.mock';

describe('AdminCategoryController', () => {
  let controller: AdminCategoryController;
  let service: jest.Mocked<ProductService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminCategoryController],
      providers: [
        {
          provide: ProductService,
          useValue: {
            findAllCategories: jest.fn(),
            findCategoryById: jest.fn(),
            createCategory: jest.fn(),
            updateCategory: jest.fn(),
            deleteCategory: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AdminCategoryController>(AdminCategoryController);
    service = module.get(ProductService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAllCategories with query', async () => {
      const paginated = mockPaginatedCategories();
      service.findAllCategories.mockResolvedValue(paginated);
      const query = { page: 1, limit: 20 } as any;

      const result = await controller.findAll(query);

      expect(result).toEqual(paginated);
      expect(service.findAllCategories).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should call service.findCategoryById with id', async () => {
      const category = mockCategoryWithChildren();
      service.findCategoryById.mockResolvedValue(category);

      const result = await controller.findOne(1);

      expect(result).toEqual(category);
      expect(service.findCategoryById).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should call service.createCategory with dto', async () => {
      const dto = { name: 'Phones', slug: 'phones' } as any;
      const category = mockCategory({ id: 2, name: 'Phones', slug: 'phones' });
      service.createCategory.mockResolvedValue(category);

      const result = await controller.create(dto);

      expect(result).toEqual(category);
      expect(service.createCategory).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should call service.updateCategory with id and dto', async () => {
      const dto = { name: 'Updated' } as any;
      const category = mockCategory({ name: 'Updated' });
      service.updateCategory.mockResolvedValue(category);

      const result = await controller.update(1, dto);

      expect(result).toEqual(category);
      expect(service.updateCategory).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('delete', () => {
    it('should call service.deleteCategory with id', async () => {
      service.deleteCategory.mockResolvedValue(undefined);

      await controller.delete(1);

      expect(service.deleteCategory).toHaveBeenCalledWith(1);
    });
  });
});
