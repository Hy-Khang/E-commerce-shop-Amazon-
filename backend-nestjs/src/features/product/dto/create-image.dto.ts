import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength, Min } from 'class-validator';

export class CreateImageDto {
  @ApiProperty({ example: 'https://cdn.example.com/img/product-1.jpg' })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  @MaxLength(500)
  image_url: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}
