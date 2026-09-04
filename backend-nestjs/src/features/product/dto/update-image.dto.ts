import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateImageDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;

  @ApiPropertyOptional({
    example: 'Black',
    description:
      'Option1 value to associate image with a variant group. NULL = shared image.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || null : value,
  )
  variant_option1?: string | null;
}
