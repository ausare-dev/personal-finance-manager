import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../entities/transaction.entity';
import { Wallet } from '../entities/wallet.entity';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { CurrenciesModule } from '../currencies/currencies.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, Wallet]),
    CurrenciesModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
