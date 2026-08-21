import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { IsVietnamesePhone } from '../../../common/validators/is-vietnamese-phone.validator';

export class CreateAddressDto {
  @ApiProperty({ example: 'Nguyen Van A', maxLength: 100 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  full_name: string;

  @ApiProperty({ example: '0901234567' })
  @IsNotEmpty()
  @IsVietnamesePhone()
  phone: string;

  @ApiProperty({ example: '123 Le Loi, Quan 1', maxLength: 255 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  address_line: string;

  @ApiProperty({ example: 'Ho Chi Minh', maxLength: 100 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiPropertyOptional({ example: 10.762622 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 106.660172 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  is_default?: boolean;
}
