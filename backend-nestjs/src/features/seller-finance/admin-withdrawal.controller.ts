import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WithdrawalService } from './withdrawal.service';
import { WithdrawalFilterDto } from './dto/withdrawal-filter.dto';
import { RejectWithdrawalDto } from './dto/reject-withdrawal.dto';
import { WithdrawalResponseDto } from './dto/withdrawal-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';

@ApiTags('Admin: Withdrawals')
@ApiBearerAuth()
@Controller('admin/withdrawals')
export class AdminWithdrawalController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  @Get()
  @Permissions(PERMISSIONS.WITHDRAWALS_READ)
  @ApiOperation({ summary: 'List withdrawal requests (paginated, ?status=)' })
  @ApiResponse({ status: 200, type: [WithdrawalResponseDto] })
  async list(@Query() query: WithdrawalFilterDto) {
    const result = await this.withdrawalService.listForAdmin({
      status: query.status,
      page: query.page,
      limit: query.limit,
    });
    return {
      data: result.data.map(WithdrawalResponseDto.fromEntity),
      meta: result.meta,
    };
  }

  @Patch(':id/approve')
  @Permissions(PERMISSIONS.WITHDRAWALS_UPDATE)
  @ApiOperation({ summary: 'Approve a withdrawal (paid out-of-band)' })
  @ApiResponse({ status: 200, type: WithdrawalResponseDto })
  @ApiResponse({ status: 400, description: 'WALLET_003' })
  async approve(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<WithdrawalResponseDto> {
    return WithdrawalResponseDto.fromEntity(
      await this.withdrawalService.approve(id, user.id),
    );
  }

  @Patch(':id/reject')
  @Permissions(PERMISSIONS.WITHDRAWALS_UPDATE)
  @ApiOperation({ summary: 'Reject a withdrawal (refunds the held amount)' })
  @ApiResponse({ status: 200, type: WithdrawalResponseDto })
  @ApiResponse({ status: 400, description: 'WALLET_003' })
  async reject(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectWithdrawalDto,
  ): Promise<WithdrawalResponseDto> {
    return WithdrawalResponseDto.fromEntity(
      await this.withdrawalService.reject(id, user.id, dto.reject_reason),
    );
  }
}
