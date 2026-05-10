import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UserProfileController } from './user-profile.controller';
import { UserProfileService } from './user-profile.service';
import { AddressRepository } from './repositories/address.repository';
import { Address } from './entities/address.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Address]), AuthModule],
  controllers: [UserProfileController],
  providers: [UserProfileService, AddressRepository],
  exports: [UserProfileService],
})
export class UserProfileModule {}
