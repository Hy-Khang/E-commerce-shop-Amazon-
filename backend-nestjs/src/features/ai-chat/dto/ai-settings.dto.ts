import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class AiSettingsResponseDto {
  @ApiProperty()
  chatbox_enabled: boolean;

  @ApiProperty({ nullable: true })
  system_prompt: string | null;

  @ApiProperty()
  updated_at: Date;
}

export class UpdateAiSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  chatbox_enabled?: boolean;

  @ApiPropertyOptional({ nullable: true, maxLength: 4000 })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  system_prompt?: string | null;
}
