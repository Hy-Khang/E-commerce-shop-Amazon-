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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';

@ApiTags('Seller: Products')
@ApiBearerAuth()
@Controller('seller')
export class SellerProductController {
  constructor(private readonly productService: ProductService) {}

  // ─── Products ───

  @Get('products')
  @Permissions(PERMISSIONS.PRODUCTS_READ)
  @ApiOperation({ summary: 'List seller\'s products (paginated)' })
  @ApiResponse({ status: 200, description: 'Returns paginated product list', type: [ProductResponseDto] })
  async findAll(@CurrentUser() user: ICurrentUser, @Query() query: ProductQueryDto) {
    return this.productService.findSellerProducts(user.id, query);
  }

  @Get('products/:id')
  @Permissions(PERMISSIONS.PRODUCTS_READ)
  @ApiOperation({ summary: 'Get seller\'s product detail (variants + images + review stats)' })
  @ApiResponse({ status: 200, description: 'Returns product detail', type: AdminProductDetailResponseDto })
  @ApiResponse({ status: 403, description: 'Product not owned by seller' })
  async findOne(@CurrentUser() user: ICurrentUser, @Param('id', ParseIntPipe) id: number) {
    return this.productService.findSellerProductById(user.id, id);
  }

  @Post('products')
  @Permissions(PERMISSIONS.PRODUCTS_CREATE)
  @ApiOperation({ summary: 'Create product (auto-assigns seller_id)' })
  @ApiResponse({ status: 201, description: 'Product created', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'PRODUCT_004: Category not found' })
  @ApiResponse({ status: 409, description: 'PRODUCT_005: Duplicate slug' })
  async create(@CurrentUser() user: ICurrentUser, @Body() dto: CreateProductDto) {
    return this.productService.createProductForSeller(user.id, dto);
  }

  @Patch('products/:id')
  @Permissions(PERMISSIONS.PRODUCTS_UPDATE)
  @ApiOperation({ summary: 'Update seller\'s product' })
  @ApiResponse({ status: 200, description: 'Product updated', type: ProductResponseDto })
  @ApiResponse({ status: 403, description: 'Product not owned by seller' })
  @ApiResponse({ status: 409, description: 'PRODUCT_005: Duplicate slug' })
  async update(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productService.updateProductForSeller(user.id, id, dto);
  }

  @Patch('products/:id/activate')
  @Permissions(PERMISSIONS.PRODUCTS_UPDATE)
  @ApiOperation({ summary: 'Toggle seller\'s product is_active' })
  @ApiResponse({ status: 200, description: 'Product activation toggled', type: ProductResponseDto })
  @ApiResponse({ status: 403, description: 'Product not owned by seller' })
  async toggleActivate(@CurrentUser() user: ICurrentUser, @Param('id', ParseIntPipe) id: number) {
    return this.productService.toggleProductActiveForSeller(user.id, id);
  }

  // ─── Variants ───

  @Post('products/:id/variants')
  @Permissions(PERMISSIONS.PRODUCTS_CREATE)
  @ApiOperation({ summary: 'Add variant to seller\'s product' })
  @ApiResponse({ status: 201, description: 'Variant created', type: VariantResponseDto })
  @ApiResponse({ status: 403, description: 'Product not owned by seller' })
  @ApiResponse({ status: 409, description: 'PRODUCT_003: Duplicate SKU' })
  async addVariant(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateVariantDto,
  ) {
    return this.productService.addVariantForSeller(user.id, id, dto);
  }

  @Patch('variants/:id')
  @Permissions(PERMISSIONS.PRODUCTS_UPDATE)
  @ApiOperation({ summary: 'Update variant of seller\'s product' })
  @ApiResponse({ status: 200, description: 'Variant updated', type: VariantResponseDto })
  @ApiResponse({ status: 403, description: 'Product not owned by seller' })
  @ApiResponse({ status: 409, description: 'PRODUCT_003: Duplicate SKU' })
  async updateVariant(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.productService.updateVariantForSeller(user.id, id, dto);
  }

  @Delete('variants/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.PRODUCTS_DELETE)
  @ApiOperation({ summary: 'Delete variant of seller\'s product' })
  @ApiResponse({ status: 204, description: 'Variant deleted' })
  @ApiResponse({ status: 403, description: 'Product not owned by seller' })
  async deleteVariant(@CurrentUser() user: ICurrentUser, @Param('id', ParseIntPipe) id: number) {
    await this.productService.deleteVariantForSeller(user.id, id);
  }

  // ─── Images ───

  @Post('products/:id/images')
  @Permissions(PERMISSIONS.PRODUCTS_CREATE)
  @ApiOperation({ summary: 'Add image to seller\'s product' })
  @ApiResponse({ status: 201, description: 'Image created', type: ImageResponseDto })
  @ApiResponse({ status: 403, description: 'Product not owned by seller' })
  async addImage(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateImageDto,
  ) {
    return this.productService.addImageForSeller(user.id, id, dto);
  }

  @Patch('images/:id')
  @Permissions(PERMISSIONS.PRODUCTS_UPDATE)
  @ApiOperation({ summary: 'Update image sort order of seller\'s product' })
  @ApiResponse({ status: 200, description: 'Image updated', type: ImageResponseDto })
  @ApiResponse({ status: 403, description: 'Product not owned by seller' })
  async updateImage(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateImageDto,
  ) {
    return this.productService.updateImageForSeller(user.id, id, dto);
  }

  @Delete('images/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.PRODUCTS_DELETE)
  @ApiOperation({ summary: 'Delete image of seller\'s product' })
  @ApiResponse({ status: 204, description: 'Image deleted' })
  @ApiResponse({ status: 403, description: 'Product not owned by seller' })
  async deleteImage(@CurrentUser() user: ICurrentUser, @Param('id', ParseIntPipe) id: number) {
    await this.productService.deleteImageForSeller(user.id, id);
  }
}
