import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  parent_id: number | null;
}

export class CategoryTreeResponseDto extends CategoryResponseDto {
  @ApiPropertyOptional({ type: [CategoryResponseDto] })
  children?: CategoryResponseDto[];
}

export class AdminCategoryDetailResponseDto extends CategoryResponseDto {
  @ApiPropertyOptional({ type: CategoryResponseDto })
  parent?: CategoryResponseDto;

  @ApiPropertyOptional({ type: [CategoryResponseDto] })
  children?: CategoryResponseDto[];

  @ApiProperty()
  productCount: number;
}
