import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Budget } from '../entities/budget.entity';
import { Wallet } from '../entities/wallet.entity';
import { BudgetsService } from './budgets.service';
import { BudgetsController } from './budgets.controller';
import { TransactionsModule } from '../transactions/transactions.module';
import { CurrenciesModule } from '../currencies/currencies.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Budget, Wallet]),
    TransactionsModule,
    CurrenciesModule,
  ],
  controllers: [BudgetsController],
  providers: [BudgetsService],
  exports: [BudgetsService],
})
export class BudgetsModule {}
