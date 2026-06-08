import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import {
  ProductResponseDto,
  AdminProductDetailResponseDto,
  VariantResponseDto,
  ImageResponseDto,
} from './dto/product-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';

@ApiTags('Admin: Products')
@ApiBearerAuth()
@Controller('admin')
export class AdminProductController {
  constructor(private readonly productService: ProductService) {}

  // ─── Products ───

  @Get('products')
  @Permissions(PERMISSIONS.PRODUCTS_READ)
  @ApiOperation({ summary: 'List all products including inactive (paginated)' })
  @ApiResponse({ status: 200, description: 'Returns paginated product list', type: [ProductResponseDto] })
  async findAll(@Query() query: ProductQueryDto) {
    return this.productService.findAllProducts(query);
  }

  @Get('products/:id')
  @Permissions(PERMISSIONS.PRODUCTS_READ)
  @ApiOperation({ summary: 'Get product detail (variants + images + review stats)' })
  @ApiResponse({ status: 200, description: 'Returns product detail', type: AdminProductDetailResponseDto })
  @ApiResponse({ status: 404, description: 'PRODUCT_001: Product not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findProductById(id);
  }

  @Post('products')
  @Permissions(PERMISSIONS.PRODUCTS_CREATE)
  @ApiOperation({ summary: 'Create product' })
  @ApiResponse({ status: 201, description: 'Product created', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'PRODUCT_004: Category not found' })
  @ApiResponse({ status: 409, description: 'PRODUCT_005: Duplicate slug' })
  async create(@Body() dto: CreateProductDto) {
    return this.productService.createProduct(dto);
  }

  @Patch('products/:id')
  @Permissions(PERMISSIONS.PRODUCTS_UPDATE)
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product updated', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'PRODUCT_001: Product not found' })
  @ApiResponse({ status: 409, description: 'PRODUCT_005: Duplicate slug' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productService.updateProduct(id, dto);
  }

  @Patch('products/:id/activate')
  @Permissions(PERMISSIONS.PRODUCTS_UPDATE)
  @ApiOperation({ summary: 'Toggle product is_active (show/hide from storefront)' })
  @ApiResponse({ status: 200, description: 'Product activation toggled', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'PRODUCT_001: Product not found' })
  async toggleActivate(@Param('id', ParseIntPipe) id: number) {
    return this.productService.toggleProductActive(id);
  }

  // ─── Variants ───

  @Post('products/:id/variants')
  @Permissions(PERMISSIONS.PRODUCTS_CREATE)
  @ApiOperation({ summary: 'Add variant to product' })
  @ApiResponse({ status: 201, description: 'Variant created', type: VariantResponseDto })
  @ApiResponse({ status: 404, description: 'PRODUCT_001: Product not found' })
  @ApiResponse({ status: 409, description: 'PRODUCT_003: Duplicate SKU' })
  async addVariant(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateVariantDto,
  ) {
    return this.productService.addVariant(id, dto);
  }

  @Patch('variants/:id')
  @Permissions(PERMISSIONS.PRODUCTS_UPDATE)
  @ApiOperation({ summary: 'Update variant' })
  @ApiResponse({ status: 200, description: 'Variant updated', type: VariantResponseDto })
  @ApiResponse({ status: 404, description: 'PRODUCT_002: Variant not found' })
  @ApiResponse({ status: 409, description: 'PRODUCT_003: Duplicate SKU' })
  async updateVariant(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.productService.updateVariant(id, dto);
  }

  @Delete('variants/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.PRODUCTS_DELETE)
  @ApiOperation({ summary: 'Delete variant (fails if referenced by active cart items)' })
  @ApiResponse({ status: 204, description: 'Variant deleted' })
  @ApiResponse({ status: 400, description: 'VARIANT_001: Cannot delete variant referenced by active cart items' })
  @ApiResponse({ status: 404, description: 'PRODUCT_002: Variant not found' })
  async deleteVariant(@Param('id', ParseIntPipe) id: number) {
    await this.productService.deleteVariant(id);
  }

  // ─── Images ───

  @Post('products/:id/images')
  @Permissions(PERMISSIONS.PRODUCTS_CREATE)
  @ApiOperation({ summary: 'Add image to product' })
  @ApiResponse({ status: 201, description: 'Image created', type: ImageResponseDto })
  @ApiResponse({ status: 404, description: 'PRODUCT_001: Product not found' })
  async addImage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateImageDto,
  ) {
    return this.productService.addImage(id, dto);
  }

  @Patch('images/:id')
  @Permissions(PERMISSIONS.PRODUCTS_UPDATE)
  @ApiOperation({ summary: 'Update image sort order' })
  @ApiResponse({ status: 200, description: 'Image updated', type: ImageResponseDto })
  @ApiResponse({ status: 404, description: 'COMMON_001: Image not found' })
  async updateImage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateImageDto,
  ) {
    return this.productService.updateImage(id, dto);
  }

  @Delete('images/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.PRODUCTS_DELETE)
  @ApiOperation({ summary: 'Delete image' })
  @ApiResponse({ status: 204, description: 'Image deleted' })
  @ApiResponse({ status: 404, description: 'COMMON_001: Image not found' })
  async deleteImage(@Param('id', ParseIntPipe) id: number) {
    await this.productService.deleteImage(id);
  }
}
