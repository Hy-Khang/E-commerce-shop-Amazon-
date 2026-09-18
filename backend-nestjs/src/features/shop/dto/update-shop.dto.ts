import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { DecorationConfigDto } from './decoration-config.dto';

export class UpdateShopDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logo_url?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  banner_url?: string;

  @ApiPropertyOptional({ maxLength: 255, description: 'Shop pickup address (Order Tracking origin)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  pickup_address?: string;

  @ApiPropertyOptional({ description: 'Pickup latitude (-90..90)' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Pickup longitude (-180..180)' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  /**
   * Storefront decoration config. Pass a validated envelope to save the layout,
   * or `null` to reset to the default layout. `@IsOptional` skips validation
   * when the value is null or undefined, so a reset is accepted as-is.
   */
  @ApiPropertyOptional({ type: DecorationConfigDto, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => DecorationConfigDto)
  decoration_config?: DecorationConfigDto | null;
}
