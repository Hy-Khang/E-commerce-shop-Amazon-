import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class SearchSuggestionsQueryDto {
  @ApiProperty({ description: 'Search query (min 2 characters)' })
  @IsString()
  @MinLength(2)
  q: string;

  @ApiPropertyOptional({ description: 'Max results per group', default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  limit?: number;
}
