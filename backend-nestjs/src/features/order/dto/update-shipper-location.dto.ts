import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdateShipperLocationDto {
  @ApiProperty({ example: 10.762622 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 106.660172 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}
