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
import { FlashSaleService } from './flash-sale.service';
import { CreateFlashSaleDto } from './dto/create-flash-sale.dto';
import { UpdateFlashSaleDto } from './dto/update-flash-sale.dto';
import { ReviewFlashSaleItemDto } from './dto/review-flash-sale-item.dto';
import { FlashSaleQueryDto } from './dto/flash-sale-query.dto';
import { FlashRegistrationQueryDto } from './dto/flash-registration-query.dto';
import { FlashSaleResponseDto } from './dto/flash-sale-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';

@ApiTags('Admin: Flash Sales')
@ApiBearerAuth()
@Controller('admin/flash-sales')
export class AdminFlashSaleController {
  constructor(private readonly flashSaleService: FlashSaleService) {}

  @Get()
  @Permissions(PERMISSIONS.FLASH_SALES_READ)
  @ApiOperation({ summary: 'List all flash sale campaigns (paginated)' })
  async findAll(@Query() query: FlashSaleQueryDto) {
    return this.flashSaleService.findAllCampaigns(query);
  }

  @Post()
  @Permissions(PERMISSIONS.FLASH_SALES_CREATE)
  @ApiOperation({
    summary: 'Create flash sale campaign (empty — sellers register products)',
  })
  @ApiResponse({ status: 201, type: FlashSaleResponseDto })
  async create(@Body() dto: CreateFlashSaleDto) {
    return this.flashSaleService.createCampaign(dto);
  }

  // ── Registration moderation routes declared BEFORE `:id` ──

  @Get('registrations')
  @Permissions(PERMISSIONS.FLASH_SALES_READ)
  @ApiOperation({
    summary: 'Global registration moderation queue (filter by status)',
  })
  async listRegistrations(@Query() query: FlashRegistrationQueryDto) {
    return this.flashSaleService.listRegistrations(query);
  }

  @Patch('items/:itemId/approve')
  @Permissions(PERMISSIONS.FLASH_SALES_UPDATE)
  @ApiOperation({ summary: 'Approve a seller registration' })
  @ApiResponse({
    status: 400,
    description: 'FLASH_SALE_012: overlapping approved campaign',
  })
  async approveItem(
    @CurrentUser() user: ICurrentUser,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.flashSaleService.approveItem(itemId, user.id);
  }

  @Patch('items/:itemId/reject')
  @Permissions(PERMISSIONS.FLASH_SALES_UPDATE)
  @ApiOperation({ summary: 'Reject a seller registration (optional reason)' })
  async rejectItem(
    @CurrentUser() user: ICurrentUser,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: ReviewFlashSaleItemDto,
  ) {
    return this.flashSaleService.rejectItem(itemId, user.id, dto.reason);
  }

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.FLASH_SALES_UPDATE)
  @ApiOperation({
    summary: 'Remove a registration from a campaign (hard delete)',
  })
  async removeItem(@Param('itemId', ParseIntPipe) itemId: number) {
    return this.flashSaleService.removeItem(itemId);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.FLASH_SALES_READ)
  @ApiOperation({
    summary: 'Get flash sale campaign detail (all registrations)',
  })
  @ApiResponse({ status: 200, type: FlashSaleResponseDto })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.flashSaleService.findCampaignById(id);
  }

  @Get(':id/items')
  @Permissions(PERMISSIONS.FLASH_SALES_READ)
  @ApiOperation({ summary: "List a campaign's registrations for moderation" })
  async findItems(@Param('id', ParseIntPipe) id: number) {
    return this.flashSaleService.findCampaignItems(id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.FLASH_SALES_UPDATE)
  @ApiOperation({ summary: 'Update flash sale campaign' })
  @ApiResponse({ status: 200, type: FlashSaleResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFlashSaleDto,
  ) {
    return this.flashSaleService.updateCampaign(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.FLASH_SALES_DELETE)
  @ApiOperation({
    summary: 'Delete flash sale campaign (cascades registrations)',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.flashSaleService.deleteCampaign(id);
  }
}
