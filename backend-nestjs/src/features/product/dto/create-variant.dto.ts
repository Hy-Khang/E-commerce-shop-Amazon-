import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
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
import { normalizeOptionalString } from '../../../common/transforms/normalize-optional-string.transform';

export class CreateVariantDto {
  @ApiProperty({ example: 'TSH-BLK-L' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  sku: string;

  @ApiPropertyOptional({ example: 'Black', description: 'Value for option 1 (e.g. color, RAM)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(normalizeOptionalString)
  option1?: string;

  @ApiPropertyOptional({ example: 'L', description: 'Value for option 2 (e.g. size, storage)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(normalizeOptionalString)
  option2?: string;

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
