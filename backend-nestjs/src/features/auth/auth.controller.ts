import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { OAuthExchangeDto } from './dto/oauth-exchange.dto';
import {
  LoginResponseDto,
  TokenPairResponseDto,
} from './dto/auth-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { FacebookAuthGuard } from './guards/facebook-auth.guard';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';
import type { IOAuthProfile } from './types/auth.types';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register new customer account' })
  @ApiResponse({ status: 201, description: 'Verification code sent' })
  @ApiResponse({ status: 409, description: 'USER_001: Email already exists' })
  @ApiResponse({
    status: 422,
    description: 'VALIDATION_001: Validation failed',
  })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with OTP code' })
  @ApiResponse({
    status: 200,
    description: 'Email verified, returns token pair',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 400, description: 'AUTH_007/AUTH_012/AUTH_013' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification code' })
  @ApiResponse({ status: 200, description: 'New verification code sent' })
  @ApiResponse({ status: 400, description: 'AUTH_011: Rate limit exceeded' })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Returns token pair + user info',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'AUTH_001: Invalid credentials / AUTH_006: Email not verified',
  })
  @ApiResponse({ status: 403, description: 'AUTH_005: Account deactivated' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Returns new token pair',
    type: TokenPairResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'AUTH_003: Refresh token expired or revoked',
  })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({
    status: 200,
    description: 'Reset email sent (silent on invalid email)',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token from email' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'AUTH_008/AUTH_012' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change password (for users with existing password)',
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed, all tokens revoked',
  })
  @ApiResponse({
    status: 401,
    description: 'AUTH_001: Current password incorrect',
  })
  async changePassword(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, dto);
  }

  @Post('set-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set password (for OAuth users without password)' })
  @ApiResponse({ status: 200, description: 'Password set successfully' })
  async setPassword(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: SetPasswordDto,
  ) {
    return this.authService.setPassword(user.id, dto);
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiExcludeEndpoint()
  async googleAuth() {}

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiExcludeEndpoint()
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    return this.handleOAuthCallback(req, res);
  }

  @Public()
  @Get('facebook')
  @UseGuards(FacebookAuthGuard)
  @ApiExcludeEndpoint()
  async facebookAuth() {}

  @Public()
  @Get('facebook/callback')
  @UseGuards(FacebookAuthGuard)
  @ApiExcludeEndpoint()
  async facebookCallback(@Req() req: Request, @Res() res: Response) {
    return this.handleOAuthCallback(req, res);
  }

  @Public()
  @Post('oauth/exchange')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange one-time OAuth code for tokens' })
  @ApiResponse({
    status: 200,
    description: 'Returns token pair + user info',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'AUTH_009: Invalid or expired code',
  })
  async exchangeOAuthCode(@Body() dto: OAuthExchangeDto) {
    return this.authService.exchangeOAuthCode(dto.code);
  }

  private async handleOAuthCallback(req: Request, res: Response) {
    const profile = req.user as IOAuthProfile;
    const user = await this.authService.oauthLogin(profile);
    const code = await this.authService.generateOAuthCode(user.id);
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );
    return res.redirect(`${frontendUrl}/oauth/callback?code=${code}`);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user state (role, permissions, is_active)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns full user state for frontend sync',
  })
  async getMe(@CurrentUser() user: ICurrentUser) {
    return this.authService.getMe(user.id);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke current refresh token' })
  @ApiResponse({ status: 200, description: 'Token revoked' })
  async logout(@Body() dto: RefreshTokenDto) {
    await this.authService.logout(dto.refreshToken);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all refresh tokens for current user' })
  @ApiResponse({ status: 200, description: 'All tokens revoked' })
  async logoutAll(@CurrentUser() user: ICurrentUser) {
    await this.authService.logoutAll(user.id);
  }
}
