import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OAuthExchangeDto {
  @ApiProperty()
  @IsString()
  code: string;
}
