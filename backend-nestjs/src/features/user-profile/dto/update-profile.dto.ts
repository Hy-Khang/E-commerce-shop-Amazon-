import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { IsVietnamesePhone } from '../../../common/validators/is-vietnamese-phone.validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Nguyen Van A', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  full_name?: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  @IsVietnamesePhone()
  phone?: string;
}
