import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateFlashSaleDto {
  @ApiPropertyOptional({ example: 'Flash Sale Cuối Tuần' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ example: '2026-08-25T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  registration_starts_at?: string;

  @ApiPropertyOptional({ example: '2026-08-31T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  registration_ends_at?: string;

  @ApiPropertyOptional({ example: '2026-09-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  starts_at?: string;

  @ApiPropertyOptional({ example: '2026-09-01T12:00:00Z' })
  @IsOptional()
  @IsDateString()
  ends_at?: string;

  @ApiPropertyOptional({
    example: 10,
    description: 'Minimum discount percent (0-100)',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  min_discount_percent?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
