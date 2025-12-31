import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import Decimal from 'decimal.js';
import { Transaction, TransactionType } from '../entities/transaction.entity';
import { Wallet } from '../entities/wallet.entity';
import { TransactionsService } from '../transactions/transactions.service';

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
    private transactionsService: TransactionsService,
  ) {}

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

    // Рассчитать суммы
    let totalIncome = new Decimal(0);
    let totalExpense = new Decimal(0);
    let incomeCount = 0;
    let expenseCount = 0;

    for (const transaction of allTransactions) {
      const amount = new Decimal(transaction.amount.toString());
      if (transaction.type === TransactionType.INCOME) {
        totalIncome = totalIncome.plus(amount);
        incomeCount++;
      } else {
        totalExpense = totalExpense.plus(amount);
        expenseCount++;
      }
    }

    const totalBalance = wallets.reduce((sum, wallet) => {
      return sum.plus(new Decimal(wallet.balance.toString()));
    }, new Decimal(0));

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
   * Получить статистику доходов и расходов за период
   */
  async getIncomeExpense(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<IncomeExpenseStats> {
    const queryBuilder = this.transactionRepository.createQueryBuilder(
      'transaction',
    );

    queryBuilder.where('transaction.userId = :userId', { userId });

    if (startDate && endDate) {
      queryBuilder.andWhere('transaction.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      queryBuilder.andWhere('transaction.date >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('transaction.date <= :endDate', { endDate });
    }

    const transactions = await queryBuilder.getMany();

    let totalIncome = new Decimal(0);
    let totalExpense = new Decimal(0);

    for (const transaction of transactions) {
      const amount = new Decimal(transaction.amount.toString());
      if (transaction.type === TransactionType.INCOME) {
        totalIncome = totalIncome.plus(amount);
      } else {
        totalExpense = totalExpense.plus(amount);
      }
    }

    const netAmount = totalIncome.minus(totalExpense);

    // Определить период
    const dates = transactions.map((t) => new Date(t.date));
    const actualStartDate = startDate || (dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date());
    const actualEndDate = endDate || (dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date());

    return {
      totalIncome: totalIncome.toNumber(),
      totalExpense: totalExpense.toNumber(),
      netAmount: netAmount.toNumber(),
      period: {
        start: actualStartDate,
        end: actualEndDate,
      },
      transactionsCount: transactions.length,
    };
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
    const queryBuilder = this.transactionRepository.createQueryBuilder(
      'transaction',
    );

    queryBuilder.where('transaction.userId = :userId', { userId });

    if (type) {
      queryBuilder.andWhere('transaction.type = :type', { type });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('transaction.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      queryBuilder.andWhere('transaction.date >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('transaction.date <= :endDate', { endDate });
    }

    const transactions = await queryBuilder.getMany();

    // Группировка по категориям
    const categoryMap = new Map<string, { amount: Decimal; count: number; type: TransactionType }>();

    for (const transaction of transactions) {
      const amount = new Decimal(transaction.amount.toString());
      const existing = categoryMap.get(transaction.category);

      if (existing) {
        existing.amount = existing.amount.plus(amount);
        existing.count++;
      } else {
        categoryMap.set(transaction.category, {
          amount,
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
    const categoryStats: CategoryStats[] = Array.from(categoryMap.entries()).map(
      ([category, data]) => {
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
      },
    );

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
    const queryBuilder = this.transactionRepository.createQueryBuilder(
      'transaction',
    );

    queryBuilder
      .where('transaction.userId = :userId', { userId })
      .andWhere('transaction.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    const transactions = await queryBuilder
      .orderBy('transaction.date', 'ASC')
      .getMany();

    // Группировка по датам
    const dateMap = new Map<
      string,
      { income: Decimal; expense: Decimal }
    >();

    for (const transaction of transactions) {
      let dateKey: string;
      const date = new Date(transaction.date);

      switch (groupBy) {
        case 'week':
          // Начало недели (понедельник)
          const weekStart = new Date(date);
          const dayOfWeek = date.getDay() || 7; // 0 = Sunday -> 7
          weekStart.setDate(date.getDate() - dayOfWeek + 1);
          dateKey = weekStart.toISOString().split('T')[0]; // YYYY-MM-DD (начало недели)
          break;
        case 'month':
          dateKey = date.toISOString().substring(0, 7); // YYYY-MM
          break;
        default:
          dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      }

      const amount = new Decimal(transaction.amount.toString());
      const existing = dateMap.get(dateKey);

      if (existing) {
        if (transaction.type === TransactionType.INCOME) {
          existing.income = existing.income.plus(amount);
        } else {
          existing.expense = existing.expense.plus(amount);
        }
      } else {
        dateMap.set(dateKey, {
          income:
            transaction.type === TransactionType.INCOME ? amount : new Decimal(0),
          expense:
            transaction.type === TransactionType.EXPENSE ? amount : new Decimal(0),
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

