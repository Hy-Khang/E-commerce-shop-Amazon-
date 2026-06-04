import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ example: 'Create Product' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'products' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  resource: string;

  @ApiProperty({ example: 'create' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  action: string;

  @ApiProperty({ example: 'Allow creating new products', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}
