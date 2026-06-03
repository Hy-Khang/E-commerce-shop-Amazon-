import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CategoryRepository } from './repositories/category.repository';
import { ProductRepository } from './repositories/product.repository';
import { ProductVariantRepository } from './repositories/product-variant.repository';
import { ProductImageRepository } from './repositories/product-image.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryQueryDto } from './dto/category-query.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductImage } from './entities/product-image.entity';
import { OrderCreatedEvent, OrderCancelledEvent } from './types/product.types';
import { IPaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { ConfigService } from '@nestjs/config';
import { unlink } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  private readonly uploadDir: string;

  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly productRepository: ProductRepository,
    private readonly productVariantRepository: ProductVariantRepository,
    private readonly productImageRepository: ProductImageRepository,
    private readonly configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get<string>('app.uploadDir')!;
  }

  // ─── Public: Categories ───

  async getCategoryTree(): Promise<Category[]> {
    return this.categoryRepository.findTree();
  }

  async getCategoryBySlug(
    slug: string,
    page: number,
    limit: number,
  ): Promise<{ category: Category; products: IPaginatedResult<Product> }> {
    const category = await this.categoryRepository.findBySlug(slug);
    if (!category) {
      throw new NotFoundException({
        code: 'PRODUCT_004',
        message: 'Category not found',
      });
    }

    const categoryIds = await this.categoryRepository.findDescendantIds(category.id);

    const products = await this.productRepository.findProductsByCategoryIds(
      categoryIds,
      page,
      limit,
    );

    return { category, products };
  }

  // ─── Public: Products ───

  async findActiveProducts(query: ProductQueryDto): Promise<IPaginatedResult<Product>> {
    return this.productRepository.findActivePaginated(query);
  }

  async findProductBySlug(slug: string): Promise<Product> {
    const product = await this.productRepository.findBySlug(slug);
    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_001',
        message: 'Product not found or inactive',
      });
    }
    return product;
  }

  // ─── Admin: Categories ───

  async findAllCategories(query: CategoryQueryDto): Promise<IPaginatedResult<Category>> {
    return this.categoryRepository.findAllPaginated(query);
  }

  async findCategoryById(id: number): Promise<Category> {
    const category = await this.categoryRepository.findByIdWithDetails(id);
    if (!category) {
      throw new NotFoundException({
        code: 'PRODUCT_004',
        message: 'Category not found',
      });
    }
    return category;
  }

  async createCategory(dto: CreateCategoryDto): Promise<Category> {
    const slugExists = await this.categoryRepository.existsBySlug(dto.slug);
    if (slugExists) {
      throw new ConflictException({
        code: 'PRODUCT_005',
        message: 'Duplicate slug',
      });
    }

    if (dto.parent_id) {
      const parent = await this.categoryRepository.findById(dto.parent_id);
      if (!parent) {
        throw new NotFoundException({
          code: 'PRODUCT_004',
          message: 'Parent category not found',
        });
      }
    }

    const category = await this.categoryRepository.create(dto);
    this.logger.log(`Category created: ${category.name} (${category.slug})`);
    return category;
  }

  async updateCategory(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException({
        code: 'PRODUCT_004',
        message: 'Category not found',
      });
    }

    if (dto.slug && dto.slug !== category.slug) {
      const slugExists = await this.categoryRepository.existsBySlugExcludingId(dto.slug, id);
      if (slugExists) {
        throw new ConflictException({
          code: 'PRODUCT_005',
          message: 'Duplicate slug',
        });
      }
    }

    if (dto.parent_id && dto.parent_id !== category.parent_id) {
      if (dto.parent_id === id) {
        throw new BadRequestException({
          code: 'CATEGORY_001',
          message: 'Category cannot be its own parent',
        });
      }
      const parent = await this.categoryRepository.findById(dto.parent_id);
      if (!parent) {
        throw new NotFoundException({
          code: 'PRODUCT_004',
          message: 'Parent category not found',
        });
      }
    }

    const updated = await this.categoryRepository.update(id, dto);
    this.logger.log(`Category updated: ${id}`);
    return updated!;
  }

  async deleteCategory(id: number): Promise<void> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException({
        code: 'PRODUCT_004',
        message: 'Category not found',
      });
    }

    const hasProductsOrChildren = await this.categoryRepository.hasProductsOrChildren(id);
    if (hasProductsOrChildren) {
      throw new BadRequestException({
        code: 'CATEGORY_001',
        message: 'Cannot delete category with existing products or children',
      });
    }

    await this.categoryRepository.delete(id);
    this.logger.log(`Category deleted: ${category.name}`);
  }

  // ─── Admin: Products ───

  async findAllProducts(query: ProductQueryDto): Promise<IPaginatedResult<Product>> {
    return this.productRepository.findAllPaginated(query);
  }

  async findProductById(id: number): Promise<Product & { reviewCount: number; avgRating: number }> {
    const product = await this.productRepository.findByIdWithReviewStats(id);
    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_001',
        message: 'Product not found or inactive',
      });
    }
    return product;
  }

  async createProduct(dto: CreateProductDto): Promise<Product> {
    const slugExists = await this.productRepository.existsBySlug(dto.slug);
    if (slugExists) {
      throw new ConflictException({
        code: 'PRODUCT_005',
        message: 'Duplicate slug',
      });
    }

    const category = await this.categoryRepository.findById(dto.category_id);
    if (!category) {
      throw new NotFoundException({
        code: 'PRODUCT_004',
        message: 'Category not found',
      });
    }

    const product = await this.productRepository.create(dto);
    this.logger.log(`Product created: ${product.name} (${product.slug})`);
    return product;
  }

  async updateProduct(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_001',
        message: 'Product not found or inactive',
      });
    }

    if (dto.slug && dto.slug !== product.slug) {
      const slugExists = await this.productRepository.existsBySlugExcludingId(dto.slug, id);
      if (slugExists) {
        throw new ConflictException({
          code: 'PRODUCT_005',
          message: 'Duplicate slug',
        });
      }
    }

    if (dto.category_id && dto.category_id !== product.category_id) {
      const category = await this.categoryRepository.findById(dto.category_id);
      if (!category) {
        throw new NotFoundException({
          code: 'PRODUCT_004',
          message: 'Category not found',
        });
      }
    }

    const updated = await this.productRepository.update(id, dto);
    this.logger.log(`Product updated: ${id}`);
    return updated!;
  }

  async toggleProductActive(id: number): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_001',
        message: 'Product not found or inactive',
      });
    }

    const newStatus = !product.is_active;
    await this.productRepository.updateIsActive(id, newStatus);
    this.logger.log(`Product ${id} ${newStatus ? 'activated' : 'deactivated'}`);

    return { ...product, is_active: newStatus };
  }

  // ─── Admin: Variants ───

  async addVariant(productId: number, dto: CreateVariantDto): Promise<ProductVariant> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_001',
        message: 'Product not found or inactive',
      });
    }

    this.validateOptionConsistency(product, dto.option1, dto.option2);

    const skuExists = await this.productVariantRepository.existsBySku(dto.sku);
    if (skuExists) {
      throw new ConflictException({
        code: 'PRODUCT_003',
        message: 'Duplicate SKU',
      });
    }

    const variant = await this.productVariantRepository.create({
      ...dto,
      product_id: productId,
    });
    this.logger.log(`Variant added to product ${productId}: ${variant.sku}`);
    return variant;
  }

  async updateVariant(id: number, dto: UpdateVariantDto): Promise<ProductVariant> {
    const variant = await this.productVariantRepository.findById(id);
    if (!variant) {
      throw new NotFoundException({
        code: 'PRODUCT_002',
        message: 'Variant not found',
      });
    }

    if (dto.sku && dto.sku !== variant.sku) {
      const skuExists = await this.productVariantRepository.existsBySkuExcludingId(dto.sku, id);
      if (skuExists) {
        throw new ConflictException({
          code: 'PRODUCT_003',
          message: 'Duplicate SKU',
        });
      }
    }

    if (dto.option1 !== undefined || dto.option2 !== undefined) {
      const product = await this.productRepository.findById(variant.product_id);
      if (product) {
        this.validateOptionConsistency(
          product,
          dto.option1 ?? variant.option1,
          dto.option2 ?? variant.option2,
        );
      }
    }

    const updated = await this.productVariantRepository.update(id, dto);
    this.logger.log(`Variant updated: ${id}`);
    return updated!;
  }

  async deleteVariant(id: number): Promise<void> {
    const variant = await this.productVariantRepository.findById(id);
    if (!variant) {
      throw new NotFoundException({
        code: 'PRODUCT_002',
        message: 'Variant not found',
      });
    }

    const hasCartItems = await this.productVariantRepository.hasActiveCartItems(id);
    if (hasCartItems) {
      throw new BadRequestException({
        code: 'VARIANT_001',
        message: 'Cannot delete variant referenced by active cart items',
      });
    }

    await this.productVariantRepository.delete(id);
    this.logger.log(`Variant deleted: ${variant.sku}`);
  }

  // ─── Admin: Images ───

  async addImage(productId: number, dto: CreateImageDto): Promise<ProductImage> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_001',
        message: 'Product not found or inactive',
      });
    }

    const image = await this.productImageRepository.create({
      ...dto,
      product_id: productId,
    });
    this.logger.log(`Image added to product ${productId}`);
    return image;
  }

  async updateImageSortOrder(id: number, dto: UpdateImageDto): Promise<ProductImage> {
    const image = await this.productImageRepository.findById(id);
    if (!image) {
      throw new NotFoundException({
        code: 'COMMON_001',
        message: 'Image not found',
      });
    }

    const updated = await this.productImageRepository.updateSortOrder(id, dto.sort_order);
    this.logger.log(`Image ${id} sort order updated to ${dto.sort_order}`);
    return updated!;
  }

  async deleteImage(id: number): Promise<void> {
    const image = await this.productImageRepository.findById(id);
    if (!image) {
      throw new NotFoundException({
        code: 'COMMON_001',
        message: 'Image not found',
      });
    }

    await this.productImageRepository.delete(id);
    this.logger.log(`Image deleted: ${id}`);

    await this.tryDeleteFile(image.image_url);
  }

  private async tryDeleteFile(imageUrl: string): Promise<void> {
    if (!imageUrl.startsWith('/uploads/')) return;

    const relativePath = imageUrl.replace(/^\/uploads\//, '');
    const filePath = join(this.uploadDir, relativePath);

    try {
      await unlink(filePath);
      this.logger.log(`File deleted: ${filePath}`);
    } catch {
      this.logger.warn(`Could not delete file: ${filePath}`);
    }
  }

  private validateOptionConsistency(
    product: Product,
    option1?: string | null,
    option2?: string | null,
  ): void {
    if (option1 && !product.option1_label) {
      throw new BadRequestException({
        code: 'PRODUCT_006',
        message: 'Cannot set option1 value: product has no option1_label defined',
      });
    }
    if (option2 && !product.option2_label) {
      throw new BadRequestException({
        code: 'PRODUCT_006',
        message: 'Cannot set option2 value: product has no option2_label defined',
      });
    }
  }

  // ─── Cross-feature: consumed by cart/order/review ───

  async findVariantById(id: number): Promise<ProductVariant | null> {
    return this.productVariantRepository.findById(id);
  }

  async findProductByIdPublic(id: number): Promise<Product | null> {
    return this.productRepository.findById(id);
  }

  // ─── Event Listeners ───

  @OnEvent('order.created')
  async handleOrderCreated(payload: OrderCreatedEvent): Promise<void> {
    this.logger.log(`Deducting stock for order ${payload.orderId}`);
    for (const item of payload.items) {
      const success = await this.productVariantRepository.deductStock(
        item.productVariantId,
        item.quantity,
      );
      if (!success) {
        this.logger.warn(
          `Failed to deduct stock for variant ${item.productVariantId}, qty ${item.quantity}`,
        );
      }
    }
  }

  @OnEvent('order.cancelled')
  async handleOrderCancelled(payload: OrderCancelledEvent): Promise<void> {
    this.logger.log(`Restoring stock for cancelled order ${payload.orderId}`);
    for (const item of payload.items) {
      await this.productVariantRepository.restoreStock(
        item.productVariantId,
        item.quantity,
      );
    }
  }
}
