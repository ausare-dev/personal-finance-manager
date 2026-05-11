import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Decimal from 'decimal.js';
import { Transaction, TransactionType } from '../entities/transaction.entity';
import { Wallet } from '../entities/wallet.entity';
import { CurrenciesService } from '../currencies/currencies.service';

export interface OverviewStats {
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  totalWallets: number;
  totalBalance: number;
  transactionsCount: number;
  incomeCount: number;
  expenseCount: number;
}

export interface IncomeExpenseStats {
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  period: {
    start: Date;
    end: Date;
  };
  transactionsCount: number;
}

export interface IncomeExpenseData {
  period: string;
  income: number;
  expense: number;
  net: number;
}

export interface CategoryStats {
  category: string;
  totalAmount: number;
  transactionCount: number;
  type: TransactionType;
  percentage: number; // Процент от общей суммы доходов/расходов
}

export interface TrendData {
  date: string; // YYYY-MM-DD
  income: number;
  expense: number;
  net: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    private currenciesService: CurrenciesService,
  ) {}

  /** Сумма в рублях для отображения сводной аналитики */
  private async toRub(amount: Decimal, currency: string): Promise<Decimal> {
    const code = (currency || 'RUB').toUpperCase();
    if (code === 'RUB') {
      return amount;
    }
    const converted = await this.currenciesService.convert(
      amount.toNumber(),
      code,
      'RUB',
    );
    // Нельзя подставлять исходную сумму как рубли — при отсутствии курса не учитываем
    if (converted === null) {
      return new Decimal(0);
    }
    return new Decimal(converted);
  }

  private async getWalletCurrencyMap(
    userId: string,
  ): Promise<Map<string, string>> {
    const ws = await this.walletRepository.find({ where: { userId } });
    return new Map(ws.map((w) => [w.id, (w.currency || 'RUB').toUpperCase()]));
  }

  /**
   * Получить общую статистику пользователя
   */
  async getOverview(userId: string): Promise<OverviewStats> {
    // Получить все транзакции пользователя
    const allTransactions = await this.transactionRepository.find({
      where: { userId },
    });

    // Получить все кошельки пользователя
    const wallets = await this.walletRepository.find({
      where: { userId },
    });

    const walletCurrencyById = new Map(
      wallets.map((w) => [w.id, (w.currency || 'RUB').toUpperCase()]),
    );

    // Рассчитать суммы в RUB (по валюте кошелька транзакции)
    let totalIncome = new Decimal(0);
    let totalExpense = new Decimal(0);
    let incomeCount = 0;
    let expenseCount = 0;

    for (const transaction of allTransactions) {
      const currency = walletCurrencyById.get(transaction.walletId);
      if (!currency) {
        continue;
      }
      const amount = new Decimal(transaction.amount.toString());
      const amountRub = await this.toRub(amount, currency);
      if (transaction.type === TransactionType.INCOME) {
        totalIncome = totalIncome.plus(amountRub);
        incomeCount++;
      } else {
        totalExpense = totalExpense.plus(amountRub);
        expenseCount++;
      }
    }

    let totalBalance = new Decimal(0);
    for (const wallet of wallets) {
      const bal = new Decimal(wallet.balance.toString());
      totalBalance = totalBalance.plus(
        await this.toRub(bal, wallet.currency || 'RUB'),
      );
    }

    const netAmount = totalIncome.minus(totalExpense);

    return {
      totalIncome: totalIncome.toNumber(),
      totalExpense: totalExpense.toNumber(),
      netAmount: netAmount.toNumber(),
      totalWallets: wallets.length,
      totalBalance: totalBalance.toNumber(),
      transactionsCount: allTransactions.length,
      incomeCount,
      expenseCount,
    };
  }

  /**
   * Получить статистику доходов и расходов за период (с группировкой по периодам)
   */
  async getIncomeExpense(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    groupBy: 'day' | 'week' | 'month' = 'day',
  ): Promise<IncomeExpenseData[]> {
    // Установить значения по умолчанию, если они не предоставлены
    const defaultStartDate =
      startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 дней назад
    const defaultEndDate = endDate || new Date();

    const queryBuilder =
      this.transactionRepository.createQueryBuilder('transaction');

    queryBuilder
      .where('transaction.userId = :userId', { userId })
      .andWhere('transaction.date BETWEEN :startDate AND :endDate', {
        startDate: defaultStartDate,
        endDate: defaultEndDate,
      });

    const transactions = await queryBuilder
      .orderBy('transaction.date', 'ASC')
      .getMany();

    const walletCurrencyById = await this.getWalletCurrencyMap(userId);

    // Группировка по периодам (суммы в RUB)
    const periodMap = new Map<string, { income: Decimal; expense: Decimal }>();

    for (const transaction of transactions) {
      const date = new Date(transaction.date);
      const currency = walletCurrencyById.get(transaction.walletId);
      if (!currency) {
        continue;
      }

      let periodKey: string;

      if (groupBy === 'day') {
        periodKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        const dayOfWeek = date.getDay() || 7; // 0 = Sunday -> 7 (как в getTrends)
        weekStart.setDate(date.getDate() - dayOfWeek + 1);
        periodKey = weekStart.toISOString().split('T')[0];
      } else {
        periodKey = date.toISOString().substring(0, 7); // YYYY-MM (как в getTrends)
      }

      const existing = periodMap.get(periodKey);
      const amountRub = await this.toRub(
        new Decimal(transaction.amount.toString()),
        currency,
      );

      if (existing) {
        if (transaction.type === TransactionType.INCOME) {
          existing.income = existing.income.plus(amountRub);
        } else {
          existing.expense = existing.expense.plus(amountRub);
        }
      } else {
        periodMap.set(periodKey, {
          income:
            transaction.type === TransactionType.INCOME
              ? amountRub
              : new Decimal(0),
          expense:
            transaction.type === TransactionType.EXPENSE
              ? amountRub
              : new Decimal(0),
        });
      }
    }

    // Преобразовать в массив и рассчитать баланс
    const result: IncomeExpenseData[] = Array.from(periodMap.entries())
      .map(([period, data]) => {
        const net = data.income.minus(data.expense);
        return {
          period,
          income: data.income.toNumber(),
          expense: data.expense.toNumber(),
          net: net.toNumber(),
        };
      })
      .sort((a, b) => a.period.localeCompare(b.period)); // Сортировать по периоду

    return result;
  }

  /**
   * Получить статистику по категориям
   */
  async getByCategory(
    userId: string,
    type?: TransactionType,
    startDate?: Date,
    endDate?: Date,
  ): Promise<CategoryStats[]> {
    const queryBuilder =
      this.transactionRepository.createQueryBuilder('transaction');

    queryBuilder.where('transaction.userId = :userId', { userId });

    if (type) {
      queryBuilder.andWhere('transaction.type = :type', { type });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'transaction.date BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    } else if (startDate) {
      queryBuilder.andWhere('transaction.date >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('transaction.date <= :endDate', { endDate });
    }

    const transactions = await queryBuilder.getMany();

    const walletCurrencyById = await this.getWalletCurrencyMap(userId);

    // Группировка по категориям (суммы в RUB)
    const categoryMap = new Map<
      string,
      { amount: Decimal; count: number; type: TransactionType }
    >();

    for (const transaction of transactions) {
      const currency = walletCurrencyById.get(transaction.walletId);
      if (!currency) {
        continue;
      }
      const amountRub = await this.toRub(
        new Decimal(transaction.amount.toString()),
        currency,
      );
      const existing = categoryMap.get(transaction.category);

      if (existing) {
        existing.amount = existing.amount.plus(amountRub);
        existing.count++;
      } else {
        categoryMap.set(transaction.category, {
          amount: amountRub,
          count: 1,
          type: transaction.type,
        });
      }
    }

    // Рассчитать общую сумму для расчета процентов
    let totalAmount = new Decimal(0);
    categoryMap.forEach((data) => {
      totalAmount = totalAmount.plus(data.amount);
    });

    // Преобразовать в массив и рассчитать проценты
    const categoryStats: CategoryStats[] = Array.from(
      categoryMap.entries(),
    ).map(([category, data]) => {
      const percentage = totalAmount.gt(0)
        ? data.amount.dividedBy(totalAmount).times(100).toNumber()
        : 0;

      return {
        category,
        totalAmount: data.amount.toNumber(),
        transactionCount: data.count,
        type: data.type,
        percentage: Math.round(percentage * 100) / 100,
      };
    });

    // Сортировать по сумме (убывание)
    return categoryStats.sort((a, b) => b.totalAmount - a.totalAmount);
  }

  /**
   * Получить тренды доходов/расходов
   */
  async getTrends(
    userId: string,
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' = 'day',
  ): Promise<TrendData[]> {
    const queryBuilder =
      this.transactionRepository.createQueryBuilder('transaction');

    queryBuilder
      .where('transaction.userId = :userId', { userId })
      .andWhere('transaction.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    const transactions = await queryBuilder
      .orderBy('transaction.date', 'ASC')
      .getMany();

    const walletCurrencyById = await this.getWalletCurrencyMap(userId);

    // Группировка по датам (суммы в RUB)
    const dateMap = new Map<string, { income: Decimal; expense: Decimal }>();

    for (const transaction of transactions) {
      const currency = walletCurrencyById.get(transaction.walletId);
      if (!currency) {
        continue;
      }

      let dateKey: string;
      const date = new Date(transaction.date);

      switch (groupBy) {
        case 'week': {
          const weekStart = new Date(date);
          const dayOfWeek = date.getDay() || 7; // 0 = Sunday -> 7
          weekStart.setDate(date.getDate() - dayOfWeek + 1);
          dateKey = weekStart.toISOString().split('T')[0]; // YYYY-MM-DD (начало недели)
          break;
        }
        case 'month':
          dateKey = date.toISOString().substring(0, 7); // YYYY-MM
          break;
        default:
          dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      }

      const amountRub = await this.toRub(
        new Decimal(transaction.amount.toString()),
        currency,
      );
      const existing = dateMap.get(dateKey);

      if (existing) {
        if (transaction.type === TransactionType.INCOME) {
          existing.income = existing.income.plus(amountRub);
        } else {
          existing.expense = existing.expense.plus(amountRub);
        }
      } else {
        dateMap.set(dateKey, {
          income:
            transaction.type === TransactionType.INCOME
              ? amountRub
              : new Decimal(0),
          expense:
            transaction.type === TransactionType.EXPENSE
              ? amountRub
              : new Decimal(0),
        });
      }
    }

    // Преобразовать в массив и отсортировать по дате
    const trends: TrendData[] = Array.from(dateMap.entries())
      .map(([date, data]) => {
        const net = data.income.minus(data.expense);
        return {
          date,
          income: data.income.toNumber(),
          expense: data.expense.toNumber(),
          net: net.toNumber(),
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return trends;
  }
}
