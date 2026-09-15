import { ApiProperty } from '@nestjs/swagger';

export class CoinSettingsResponseDto {
  @ApiProperty({ description: 'Master on/off switch for the coin feature' })
  enabled: boolean;

  @ApiProperty({ description: '% of post-discount items total earned as Xu' })
  earn_rate_percent: number;

  @ApiProperty({ description: 'Max % of a checkout redeemable in Xu' })
  redeem_max_percent: number;

  @ApiProperty({ description: 'Days until an earned Xu batch expires' })
  expiry_days: number;
}
