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
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { PermissionResponseDto } from './dto/permission-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';

@ApiTags('Admin: Roles')
@ApiBearerAuth()
@Controller('admin/roles')
export class AdminRoleController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @Permissions(PERMISSIONS.ROLES_READ)
  @ApiOperation({ summary: 'List all roles with user count' })
  @ApiResponse({ status: 200, description: 'Returns all roles', type: [RoleResponseDto] })
  async findAll() {
    return this.authService.findAllRoles();
  }

  @Get(':id')
  @Permissions(PERMISSIONS.ROLES_READ)
  @ApiOperation({ summary: 'Get role by ID with user count' })
  @ApiResponse({ status: 200, description: 'Returns role detail', type: RoleResponseDto })
  @ApiResponse({ status: 404, description: 'COMMON_001: Role not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.authService.findRoleById(id);
  }

  @Post()
  @Permissions(PERMISSIONS.ROLES_CREATE)
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created' })
  @ApiResponse({ status: 409, description: 'ROLE_001: Role name already exists' })
  async create(@Body() dto: CreateRoleDto) {
    return this.authService.createRole(dto);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.ROLES_UPDATE)
  @ApiOperation({ summary: 'Update role name' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  @ApiResponse({ status: 404, description: 'COMMON_001: Role not found' })
  @ApiResponse({ status: 409, description: 'ROLE_001: Role name already exists' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.authService.updateRole(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.ROLES_DELETE)
  @ApiOperation({ summary: 'Delete role (fails if users assigned or system role)' })
  @ApiResponse({ status: 204, description: 'Role deleted' })
  @ApiResponse({ status: 400, description: 'ROLE_002 / PERMISSION_006: Cannot delete' })
  @ApiResponse({ status: 404, description: 'COMMON_001: Role not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.authService.deleteRole(id);
  }

  // ─── Role-Permission Assignment ───

  @Get(':id/permissions')
  @Permissions(PERMISSIONS.ROLES_READ)
  @ApiOperation({ summary: "List role's permissions" })
  @ApiResponse({ status: 200, description: 'Returns role permissions', type: [PermissionResponseDto] })
  @ApiResponse({ status: 404, description: 'COMMON_001: Role not found' })
  async getRolePermissions(@Param('id', ParseIntPipe) id: number) {
    return this.authService.getRolePermissions(id);
  }

  @Put(':id/permissions')
  @Permissions(PERMISSIONS.ROLES_UPDATE)
  @ApiOperation({ summary: 'Sync (replace all) permissions for a role' })
  @ApiResponse({ status: 200, description: 'Permissions synced', type: [PermissionResponseDto] })
  @ApiResponse({ status: 403, description: 'PERMISSION_004/005: Escalation prevented' })
  @ApiResponse({ status: 404, description: 'COMMON_001: Role not found' })
  async syncPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignPermissionsDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.authService.syncRolePermissions(id, dto, user.roleId);
  }

  @Post(':id/permissions')
  @Permissions(PERMISSIONS.ROLES_UPDATE)
  @ApiOperation({ summary: 'Add permissions to role' })
  @ApiResponse({ status: 201, description: 'Permissions added', type: [PermissionResponseDto] })
  @ApiResponse({ status: 403, description: 'PERMISSION_004/005: Escalation prevented' })
  @ApiResponse({ status: 404, description: 'COMMON_001: Role not found' })
  async addPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignPermissionsDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.authService.addRolePermissions(id, dto, user.roleId);
  }

  @Delete(':id/permissions')
  @Permissions(PERMISSIONS.ROLES_UPDATE)
  @ApiOperation({ summary: 'Remove permissions from role' })
  @ApiResponse({ status: 200, description: 'Permissions removed', type: [PermissionResponseDto] })
  @ApiResponse({ status: 403, description: 'PERMISSION_005: Cannot modify own role' })
  @ApiResponse({ status: 404, description: 'COMMON_001: Role not found' })
  async removePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignPermissionsDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.authService.removeRolePermissions(id, dto, user.roleId);
  }
}
