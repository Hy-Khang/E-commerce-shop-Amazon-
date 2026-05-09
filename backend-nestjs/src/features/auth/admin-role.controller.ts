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
import { AuthService } from './auth.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin: Roles')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin/roles')
export class AdminRoleController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @ApiOperation({ summary: 'List all roles with user count' })
  @ApiResponse({ status: 200, description: 'Returns all roles', type: [RoleResponseDto] })
  async findAll() {
    return this.authService.findAllRoles();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID with user count' })
  @ApiResponse({ status: 200, description: 'Returns role detail', type: RoleResponseDto })
  @ApiResponse({ status: 404, description: 'COMMON_001: Role not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.authService.findRoleById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created' })
  @ApiResponse({ status: 409, description: 'ROLE_001: Role name already exists' })
  async create(@Body() dto: CreateRoleDto) {
    return this.authService.createRole(dto);
  }

  @Patch(':id')
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
  @ApiOperation({ summary: 'Delete role (fails if users assigned)' })
  @ApiResponse({ status: 204, description: 'Role deleted' })
  @ApiResponse({ status: 400, description: 'ROLE_002: Cannot delete role with assigned users' })
  @ApiResponse({ status: 404, description: 'COMMON_001: Role not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.authService.deleteRole(id);
  }
}
