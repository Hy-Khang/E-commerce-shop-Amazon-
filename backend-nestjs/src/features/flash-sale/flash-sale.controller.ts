import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FlashSaleService } from './flash-sale.service';
import { FlashSaleResponseDto } from './dto/flash-sale-response.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Flash Sales')
@Controller('flash-sales')
export class FlashSaleController {
  constructor(private readonly flashSaleService: FlashSaleService) {}

  @Get('active')
  @Public()
  @ApiOperation({ summary: 'List currently-active flash sale campaigns' })
  @ApiResponse({ status: 200, type: [FlashSaleResponseDto] })
  async findActive() {
    return this.flashSaleService.findActiveCampaigns();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a flash sale campaign detail' })
  @ApiResponse({ status: 200, type: FlashSaleResponseDto })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.flashSaleService.findActiveCampaignById(id);
  }
}
