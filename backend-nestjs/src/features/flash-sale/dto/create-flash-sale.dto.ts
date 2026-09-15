import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateFlashSaleDto {
  @ApiProperty({ example: 'Flash Sale Cuối Tuần' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiProperty({
    example: '2026-08-25T00:00:00Z',
    description: 'Registration window opens',
  })
  @IsDateString()
  registration_starts_at: string;

  @ApiProperty({
    example: '2026-08-31T00:00:00Z',
    description: 'Registration deadline (≤ starts_at)',
  })
  @IsDateString()
  registration_ends_at: string;

  @ApiProperty({ example: '2026-09-01T00:00:00Z' })
  @IsDateString()
  starts_at: string;

  @ApiProperty({ example: '2026-09-01T12:00:00Z' })
  @IsDateString()
  ends_at: string;

  @ApiProperty({
    example: 10,
    description: 'Mandatory minimum discount percent (0-100)',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  min_discount_percent: number;
}
