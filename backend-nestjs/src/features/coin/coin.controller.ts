import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CoinService } from './coin.service';
import { CoinBalanceResponseDto } from './dto/coin-balance-response.dto';
import { CoinTransactionResponseDto } from './dto/coin-transaction-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';

@ApiTags('Coin (Hoàn Xu)')
@ApiBearerAuth()
@Controller('coins')
export class CoinController {
  constructor(private readonly coinService: CoinService) {}

  @Get('balance')
  @ApiOperation({ summary: 'My Xu balance + batches expiring soon' })
  @ApiResponse({ status: 200, type: CoinBalanceResponseDto })
  async getBalance(
    @CurrentUser() user: ICurrentUser,
  ): Promise<CoinBalanceResponseDto> {
    return this.coinService.getBalance(user.id);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'My Xu ledger (paginated, newest first)' })
  @ApiResponse({ status: 200, type: [CoinTransactionResponseDto] })
  async getTransactions(
    @CurrentUser() user: ICurrentUser,
    @Query() query: PaginationDto,
  ) {
    return this.coinService.getTransactions(user.id, query.page, query.limit);
  }
}
