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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionResponseDto } from './dto/permission-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';

@ApiTags('Admin: Permissions')
@ApiBearerAuth()
@Controller('admin/permissions')
export class AdminPermissionController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @Permissions(PERMISSIONS.PERMISSIONS_READ)
  @ApiOperation({ summary: 'List all permissions (filter by ?resource=)' })
  @ApiQuery({ name: 'resource', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Returns all permissions', type: [PermissionResponseDto] })
  async findAll(@Query('resource') resource?: string) {
    return this.authService.findAllPermissions(resource);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.PERMISSIONS_READ)
  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiResponse({ status: 200, description: 'Returns permission detail', type: PermissionResponseDto })
  @ApiResponse({ status: 404, description: 'PERMISSION_003: Permission not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.authService.findPermissionById(id);
  }

  @Post()
  @Permissions(PERMISSIONS.PERMISSIONS_CREATE)
  @ApiOperation({ summary: 'Create permission' })
  @ApiResponse({ status: 201, description: 'Permission created', type: PermissionResponseDto })
  @ApiResponse({ status: 409, description: 'PERMISSION_001: Permission resource:action already exists' })
  async create(@Body() dto: CreatePermissionDto) {
    return this.authService.createPermission(dto);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.PERMISSIONS_UPDATE)
  @ApiOperation({ summary: 'Update permission (name, description)' })
  @ApiResponse({ status: 200, description: 'Permission updated', type: PermissionResponseDto })
  @ApiResponse({ status: 404, description: 'PERMISSION_003: Permission not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.authService.updatePermission(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.PERMISSIONS_DELETE)
  @ApiOperation({ summary: 'Delete permission (fails if assigned to roles)' })
  @ApiResponse({ status: 204, description: 'Permission deleted' })
  @ApiResponse({ status: 400, description: 'PERMISSION_002: Cannot delete permission assigned to roles' })
  @ApiResponse({ status: 404, description: 'PERMISSION_003: Permission not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.authService.deletePermission(id);
  }
}
