import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProductService } from './product.service';
import { ProductQueryDto } from './dto/product-query.dto';
import { SearchSuggestionsQueryDto } from './dto/search-suggestions-query.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { CategoryTreeResponseDto } from './dto/category-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Product Catalog')
@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'List category tree' })
  @ApiResponse({
    status: 200,
    description: 'Returns category tree',
    type: [CategoryTreeResponseDto],
  })
  async getCategoryTree() {
    return this.productService.getCategoryTree();
  }

  @Public()
  @Get('categories/:slug')
  @ApiOperation({ summary: 'Get category with products (paginated)' })
  @ApiResponse({
    status: 200,
    description: 'Returns category with paginated products',
  })
  @ApiResponse({ status: 404, description: 'PRODUCT_004: Category not found' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getCategoryBySlug(
    @Param('slug') slug: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.productService.getCategoryBySlug(
      slug,
      pagination.page,
      pagination.limit,
    );
  }

  @Public()
  @Get('products')
  @ApiOperation({
    summary: 'List active products (paginated, filtered, sorted)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated product list',
    type: [ProductResponseDto],
  })
  async findAll(@Query() query: ProductQueryDto) {
    return this.productService.findActiveProducts(query);
  }

  @Public()
  @Get('products/suggestions')
  @ApiOperation({ summary: 'Search suggestions (products, categories, shops)' })
  @ApiResponse({
    status: 200,
    description: 'Returns grouped search suggestions',
  })
  async getSuggestions(@Query() query: SearchSuggestionsQueryDto) {
    return this.productService.getSearchSuggestions(query.q, query.limit);
  }

  @Public()
  @Post('products/search-by-image')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Visual search — find products by image (AI)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Returns AI tags and matching products',
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async searchByImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Query() pagination: PaginationDto,
  ) {
    return this.productService.searchByImage(
      file,
      pagination.page,
      pagination.limit,
    );
  }

  @Public()
  @Get('products/:slug')
  @ApiOperation({ summary: 'Get product detail (variants + images)' })
  @ApiResponse({
    status: 200,
    description: 'Returns product detail',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'PRODUCT_001: Product not found or inactive',
  })
  async findBySlug(@Param('slug') slug: string) {
    return this.productService.findProductBySlug(slug);
  }
}
