import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty({ description: 'New role ID', example: 2 })
  @IsInt()
  @IsPositive()
  role_id: number;
}
