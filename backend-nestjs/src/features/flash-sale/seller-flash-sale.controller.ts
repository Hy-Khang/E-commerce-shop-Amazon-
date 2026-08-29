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
import { RegisterFlashSaleItemDto } from './dto/register-flash-sale-item.dto';
import { UpdateFlashSaleItemDto } from './dto/update-flash-sale-item.dto';
import { FlashRegistrationQueryDto } from './dto/flash-registration-query.dto';
import { FlashSaleResponseDto } from './dto/flash-sale-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';

@ApiTags('Seller: Flash Sales')
@ApiBearerAuth()
@Controller('seller/flash-sales')
export class SellerFlashSaleController {
  constructor(private readonly flashSaleService: FlashSaleService) {}

  @Get()
  @Permissions(PERMISSIONS.FLASH_REGISTRATIONS_READ)
  @ApiOperation({ summary: 'List campaigns currently open for registration' })
  @ApiResponse({ status: 200, type: [FlashSaleResponseDto] })
  async findOpen(@CurrentUser() user: ICurrentUser) {
    return this.flashSaleService.findOpenCampaignsForSeller(user.id);
  }

  // Declared BEFORE `:id` so `registrations` is never parsed as an id.
  @Get('registrations')
  @Permissions(PERMISSIONS.FLASH_REGISTRATIONS_READ)
  @ApiOperation({ summary: "List the current shop's registrations (paginated)" })
  async findMyRegistrations(
    @CurrentUser() user: ICurrentUser,
    @Query() query: FlashRegistrationQueryDto,
  ) {
    return this.flashSaleService.findSellerRegistrations(user.id, query);
  }

  @Patch('items/:itemId')
  @Permissions(PERMISSIONS.FLASH_REGISTRATIONS_UPDATE)
  @ApiOperation({ summary: 'Edit a pending registration (price / quantity, own shop only)' })
  @ApiResponse({ status: 403, description: 'FLASH_SALE_008: registration not owned by your shop' })
  async updateItem(
    @CurrentUser() user: ICurrentUser,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateFlashSaleItemDto,
  ) {
    return this.flashSaleService.updateSellerItem(user.id, itemId, dto);
  }

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.FLASH_REGISTRATIONS_DELETE)
  @ApiOperation({ summary: 'Withdraw a pending registration (own shop only)' })
  async withdrawItem(
    @CurrentUser() user: ICurrentUser,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.flashSaleService.withdrawSellerItem(user.id, itemId);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.FLASH_REGISTRATIONS_READ)
  @ApiOperation({ summary: "Campaign detail with the shop's own registrations" })
  @ApiResponse({ status: 200, type: FlashSaleResponseDto })
  async findOne(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.flashSaleService.findSellerCampaign(user.id, id);
  }

  @Post(':id/register')
  @Permissions(PERMISSIONS.FLASH_REGISTRATIONS_CREATE)
  @ApiOperation({ summary: 'Register a variant of your shop into a campaign' })
  @ApiResponse({ status: 400, description: 'FLASH_SALE_009/010/011: window/ownership/floor' })
  async register(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegisterFlashSaleItemDto,
  ) {
    return this.flashSaleService.registerItem(user.id, id, dto);
  }
}
