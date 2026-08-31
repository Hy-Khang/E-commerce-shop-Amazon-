import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoinBatch } from './entities/coin-batch.entity';
import { CoinTransaction } from './entities/coin-transaction.entity';
import { CoinBatchRepository } from './repositories/coin-batch.repository';
import { CoinTransactionRepository } from './repositories/coin-transaction.repository';
import { CoinService } from './coin.service';
import { CoinController } from './coin.controller';
import { CoinScheduler } from './coin.scheduler';

@Module({
  imports: [TypeOrmModule.forFeature([CoinBatch, CoinTransaction])],
  controllers: [CoinController],
  providers: [
    CoinService,
    CoinScheduler,
    CoinBatchRepository,
    CoinTransactionRepository,
  ],
  exports: [CoinService],
})
export class CoinModule {}
