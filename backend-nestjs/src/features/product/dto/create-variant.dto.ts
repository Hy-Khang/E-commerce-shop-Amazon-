import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateVariantDto {
  @ApiProperty({ example: 'TSH-BLK-L' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  sku: string;

  @ApiPropertyOptional({ example: 'Black' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @ApiPropertyOptional({ example: 'L' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  size?: string;

  @ApiProperty({ example: 250000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @ApiPropertyOptional({ example: 200000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  sale_price?: number;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(0)
  stock_quantity: number;
}
