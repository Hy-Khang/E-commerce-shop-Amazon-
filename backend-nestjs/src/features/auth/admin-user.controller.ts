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
import { AuthService } from './auth.service';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import {
  AdminUserResponseDto,
  AdminUserDetailResponseDto,
} from './dto/admin-user-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';

@ApiTags('Admin: Users')
@ApiBearerAuth()
@Controller('admin/users')
export class AdminUserController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @Permissions(PERMISSIONS.USERS_READ)
  @ApiOperation({ summary: 'List all users (paginated, filtered, sorted)' })
  @ApiResponse({ status: 200, description: 'Returns paginated user list', type: [AdminUserResponseDto] })
  async findAll(@Query() query: AdminUserQueryDto) {
    return this.authService.findAllUsers(query);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.USERS_READ)
  @ApiOperation({ summary: 'Get user detail with order and review counts' })
  @ApiResponse({ status: 200, description: 'Returns user detail', type: AdminUserDetailResponseDto })
  @ApiResponse({ status: 404, description: 'USER_002: User not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.authService.findUserById(id);
  }

  @Patch(':id/activate')
  @Permissions(PERMISSIONS.USERS_UPDATE)
  @ApiOperation({ summary: 'Toggle user is_active (ban/unban)' })
  @ApiResponse({ status: 200, description: 'User activation toggled' })
  @ApiResponse({ status: 404, description: 'USER_002: User not found' })
  async toggleActivate(@Param('id', ParseIntPipe) id: number) {
    return this.authService.toggleActivate(id);
  }

  @Patch(':id/role')
  @Permissions(PERMISSIONS.USERS_UPDATE)
  @ApiOperation({ summary: 'Change user role' })
  @ApiResponse({ status: 200, description: 'User role updated' })
  @ApiResponse({ status: 404, description: 'USER_002: User not found / COMMON_001: Role not found' })
  async changeRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.authService.changeUserRole(id, dto);
  }
}
