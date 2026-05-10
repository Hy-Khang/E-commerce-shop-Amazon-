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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';
import { UserProfileService } from './user-profile.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('User Profile')
@ApiBearerAuth()
@Controller()
export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}

  @Get('users/me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile returned' })
  async getProfile(@CurrentUser() user: ICurrentUser) {
    return this.userProfileService.getProfile(user.id);
  }

  @Patch('users/me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userProfileService.updateProfile(user.id, dto);
  }

  @Get('addresses')
  @ApiOperation({ summary: 'List my addresses' })
  @ApiResponse({ status: 200, description: 'List of addresses' })
  async findAll(@CurrentUser() user: ICurrentUser) {
    return this.userProfileService.findAllAddresses(user.id);
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Create new address' })
  @ApiResponse({ status: 201, description: 'Address created' })
  async create(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: CreateAddressDto,
  ) {
    return this.userProfileService.createAddress(user.id, dto);
  }

  @Patch('addresses/:id')
  @ApiOperation({ summary: 'Update address' })
  @ApiResponse({ status: 200, description: 'Address updated' })
  async update(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.userProfileService.updateAddress(user.id, id, dto);
  }

  @Delete('addresses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete address' })
  @ApiResponse({ status: 204, description: 'Address deleted' })
  async delete(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.userProfileService.deleteAddress(user.id, id);
  }

  @Patch('addresses/:id/default')
  @ApiOperation({ summary: 'Set address as default' })
  @ApiResponse({ status: 200, description: 'Default address set' })
  async setDefault(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.userProfileService.setDefaultAddress(user.id, id);
  }
}
