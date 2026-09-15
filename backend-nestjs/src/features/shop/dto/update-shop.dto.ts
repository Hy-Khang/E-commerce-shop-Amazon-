import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  MaxLength,
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
