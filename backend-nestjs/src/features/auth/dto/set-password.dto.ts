import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetPasswordDto {
  @ApiProperty({ example: 'newPassword123' })
  @IsString()
  @MinLength(8)
  new_password: string;
}
