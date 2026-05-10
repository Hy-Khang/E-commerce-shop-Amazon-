import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './core/database/database.module';
import { AuthModule } from './features/auth/auth.module';
import { UserProfileModule } from './features/user-profile/user-profile.module';
import { ProductModule } from './features/product/product.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    EventEmitterModule.forRoot(),
    AuthModule,
    UserProfileModule,
    ProductModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
