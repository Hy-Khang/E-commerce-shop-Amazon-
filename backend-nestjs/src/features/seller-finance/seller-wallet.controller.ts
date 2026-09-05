import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SellerWalletService } from './seller-wallet.service';
import { WithdrawalService } from './withdrawal.service';
import {
  WalletBalanceResponseDto,
  WalletTransactionResponseDto,
} from './dto/wallet-response.dto';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { WithdrawalResponseDto } from './dto/withdrawal-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';

@ApiTags('Seller: Wallet & Payout')
@ApiBearerAuth()
@Controller('seller')
export class SellerWalletController {
  constructor(
    private readonly walletService: SellerWalletService,
    private readonly withdrawalService: WithdrawalService,
  ) {}

  @Get('wallet')
  @Permissions(PERMISSIONS.WALLET_READ)
  @ApiOperation({ summary: 'My wallet balance' })
  @ApiResponse({ status: 200, type: WalletBalanceResponseDto })
  async getWallet(
    @CurrentUser() user: ICurrentUser,
  ): Promise<WalletBalanceResponseDto> {
    return this.walletService.getBalance(user.id);
  }

  @Get('wallet/transactions')
  @Permissions(PERMISSIONS.WALLET_READ)
  @ApiOperation({ summary: 'My wallet ledger (paginated, newest first)' })
  @ApiResponse({ status: 200, type: [WalletTransactionResponseDto] })
  async getWalletTransactions(
    @CurrentUser() user: ICurrentUser,
    @Query() query: PaginationDto,
  ) {
    return this.walletService.getTransactions(user.id, query.page, query.limit);
  }

  @Post('withdrawals')
  @Permissions(PERMISSIONS.WITHDRAWALS_CREATE)
  @ApiOperation({ summary: 'Request a payout (holds the amount immediately)' })
  @ApiResponse({ status: 201, type: WithdrawalResponseDto })
  @ApiResponse({ status: 400, description: 'WALLET_002: Insufficient balance' })
  async requestWithdrawal(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: CreateWithdrawalDto,
  ): Promise<WithdrawalResponseDto> {
    return WithdrawalResponseDto.fromEntity(
      await this.withdrawalService.requestWithdrawal(user.id, dto),
    );
  }

  @Get('withdrawals')
  @Permissions(PERMISSIONS.WALLET_READ)
  @ApiOperation({ summary: 'My withdrawal history (paginated)' })
  @ApiResponse({ status: 200, type: [WithdrawalResponseDto] })
  async listMyWithdrawals(
    @CurrentUser() user: ICurrentUser,
    @Query() query: PaginationDto,
  ) {
    const result = await this.withdrawalService.listMine(
      user.id,
      query.page,
      query.limit,
    );
    return {
      data: result.data.map(WithdrawalResponseDto.fromEntity),
      meta: result.meta,
    };
  }
}
