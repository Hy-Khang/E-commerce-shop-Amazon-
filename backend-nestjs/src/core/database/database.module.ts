import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { registerPgTypeParsers } from './pg-type-parsers';

// Fix numeric/bigint → number before any connection is established (Postgres).
registerPgTypeParsers();

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.database'),
        autoLoadEntities: true,
        synchronize: config.get<boolean>('database.synchronize') ?? false,
        logging: config.get<boolean>('database.logging') ?? false,
        // Supabase requires SSL. rejectUnauthorized:false accepts the pooler cert.
        ssl: config.get<boolean>('database.ssl')
          ? { rejectUnauthorized: false }
          : false,
        // Store/return UTC consistently (mirrors the old tedious useUTC:true).
        extra: { options: '-c timezone=UTC' },
      }),
    }),
  ],
})
export class DatabaseModule {}
