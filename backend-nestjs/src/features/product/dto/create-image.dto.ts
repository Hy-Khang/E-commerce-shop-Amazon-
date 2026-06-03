import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { IsImagePath } from '../../../common/validators/is-image-path.validator';

export class CreateImageDto {
  @ApiProperty({ example: 'https://cdn.example.com/img/product-1.jpg' })
  @IsString()
  @IsNotEmpty()
  @IsImagePath()
  @MaxLength(500)
  image_url: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}
