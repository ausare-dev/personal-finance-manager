import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { CurrencyRate } from '../entities/currency-rate.entity';
import { CurrenciesService } from './currencies.service';
import { CurrenciesController } from './currencies.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([CurrencyRate]),
    ScheduleModule.forRoot(),
  ],
  controllers: [CurrenciesController],
  providers: [CurrenciesService],
  exports: [CurrenciesService],
})
export class CurrenciesModule {}

