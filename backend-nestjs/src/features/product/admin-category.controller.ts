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
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryQueryDto } from './dto/category-query.dto';
import {
  CategoryResponseDto,
  AdminCategoryDetailResponseDto,
} from './dto/category-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';

@ApiTags('Admin: Categories')
@ApiBearerAuth()
@Controller('admin/categories')
export class AdminCategoryController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @Permissions(PERMISSIONS.CATEGORIES_READ)
  @ApiOperation({ summary: 'List all categories flat (paginated, includes product count)' })
  @ApiResponse({ status: 200, description: 'Returns paginated category list', type: [CategoryResponseDto] })
  async findAll(@Query() query: CategoryQueryDto) {
    return this.productService.findAllCategories(query);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.CATEGORIES_READ)
  @ApiOperation({ summary: 'Get category detail (parent info + direct children + product count)' })
  @ApiResponse({ status: 200, description: 'Returns category detail', type: AdminCategoryDetailResponseDto })
  @ApiResponse({ status: 404, description: 'PRODUCT_004: Category not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findCategoryById(id);
  }

  @Post()
  @Permissions(PERMISSIONS.CATEGORIES_CREATE)
  @ApiOperation({ summary: 'Create category' })
  @ApiResponse({ status: 201, description: 'Category created', type: CategoryResponseDto })
  @ApiResponse({ status: 409, description: 'PRODUCT_005: Duplicate slug' })
  async create(@Body() dto: CreateCategoryDto) {
    return this.productService.createCategory(dto);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.CATEGORIES_UPDATE)
  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({ status: 200, description: 'Category updated', type: CategoryResponseDto })
  @ApiResponse({ status: 404, description: 'PRODUCT_004: Category not found' })
  @ApiResponse({ status: 409, description: 'PRODUCT_005: Duplicate slug' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.productService.updateCategory(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.CATEGORIES_DELETE)
  @ApiOperation({ summary: 'Delete category (fails if has products or children)' })
  @ApiResponse({ status: 204, description: 'Category deleted' })
  @ApiResponse({ status: 400, description: 'CATEGORY_001: Cannot delete category with existing products or children' })
  @ApiResponse({ status: 404, description: 'PRODUCT_004: Category not found' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.productService.deleteCategory(id);
  }
}
