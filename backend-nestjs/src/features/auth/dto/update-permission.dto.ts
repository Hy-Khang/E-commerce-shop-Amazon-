import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePermissionDto {
  @ApiProperty({ example: 'Create Product', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiProperty({ example: 'Allow creating new products', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}
