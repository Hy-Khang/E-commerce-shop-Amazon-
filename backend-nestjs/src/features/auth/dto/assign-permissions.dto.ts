import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';

export class AssignPermissionsDto {
  @ApiProperty({ example: [1, 2, 3], type: [Number] })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  permission_ids: number[];
}
