import { ApiProperty } from '@nestjs/swagger';

export class AddressResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Nguyen Van A' })
  full_name: string;

  @ApiProperty({ example: '0901234567' })
  phone: string;

  @ApiProperty({ example: '123 Le Loi, Quan 1' })
  address_line: string;

  @ApiProperty({ example: 'Ho Chi Minh' })
  city: string;

  @ApiProperty({ example: false })
  is_default: boolean;
}
