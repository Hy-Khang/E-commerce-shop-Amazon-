import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminUserResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  full_name: string;

  @ApiPropertyOptional()
  phone: string | null;

  @ApiProperty()
  is_active: boolean;

  @ApiProperty()
  role: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class AdminUserDetailResponseDto extends AdminUserResponseDto {
  @ApiProperty()
  orderCount: number;

  @ApiProperty()
  reviewCount: number;
}
