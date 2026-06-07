import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ShopStatus } from '../../../common/constants';

export class UpdateShopStatusDto {
  @ApiProperty({ enum: ShopStatus })
  @IsEnum(ShopStatus)
  status: ShopStatus;
}
