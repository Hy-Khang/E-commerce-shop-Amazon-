import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Electronics' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'electronics' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  slug: string;

  @ApiPropertyOptional({ example: 1, description: 'Parent category ID for nesting' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  parent_id?: number;
}
