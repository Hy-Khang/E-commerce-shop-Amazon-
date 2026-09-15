import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { SellerApplicationStatus } from '../types/seller-application.types';

export class SellerApplicationFilterDto extends PaginationDto {
  @ApiPropertyOptional({ enum: SellerApplicationStatus })
  @IsOptional()
  @IsEnum(SellerApplicationStatus)
  status?: SellerApplicationStatus;
}
