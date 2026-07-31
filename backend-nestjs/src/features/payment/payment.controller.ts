import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';
import type { IMomoIpnPayload } from './types/payment.types';
import type { Request, Response } from 'express';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create payment URL for an order or order group' })
  @ApiResponse({ status: 201, description: 'Returns payment_url to redirect' })
  @ApiResponse({ status: 400, description: 'PAYMENT_001-006' })
  async createPayment(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: CreatePaymentDto,
    @Req() req: Request,
  ) {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    return this.paymentService.createPayment(user.id, dto, ipAddress);
  }

  @Get('vnpay/ipn')
  @Public()
  @ApiOperation({ summary: 'VNPay IPN callback' })
  async vnpayIpn(@Query() query: Record<string, string>) {
    return this.paymentService.handleVnpayIpn(query);
  }

  @Get('vnpay/return')
  @Public()
  @ApiOperation({ summary: 'VNPay return URL — redirects to frontend' })
  async vnpayReturn(
    @Query() query: Record<string, string>,
    @Res() res: Response,
  ) {
    const redirectUrl =
      await this.paymentService.buildVnpayReturnRedirect(query);
    res.redirect(redirectUrl);
  }

  @Post('momo/ipn')
  @Public()
  @ApiOperation({ summary: 'MoMo IPN callback' })
  async momoIpn(@Body() payload: IMomoIpnPayload) {
    await this.paymentService.handleMomoIpn(payload);
    return { status: 0 };
  }

  @Get('momo/return')
  @Public()
  @ApiOperation({ summary: 'MoMo return URL — redirects to frontend' })
  async momoReturn(
    @Query() query: Record<string, string>,
    @Res() res: Response,
  ) {
    const redirectUrl =
      await this.paymentService.buildMomoReturnRedirect(query);
    res.redirect(redirectUrl);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get payment transactions for an order' })
  @ApiResponse({ status: 200, description: 'Returns payment transactions' })
  async getPaymentsByOrder(
    @CurrentUser() user: ICurrentUser,
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    return this.paymentService.getPaymentsByOrder(orderId, user.id);
  }
}
