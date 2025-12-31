import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget, BudgetPeriod } from '../entities/budget.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionType } from '../entities/transaction.entity';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

export interface BudgetWithUsage extends Budget {
  used: number;
  remaining: number;
  usagePercentage: number;
}

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private budgetRepository: Repository<Budget>,
    private transactionsService: TransactionsService,
  ) {}

  async findAll(userId: string): Promise<BudgetWithUsage[]> {
    const budgets = await this.budgetRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return Promise.all(
      budgets.map((budget) => this.calculateUsage(budget, userId)),
    );
  }

  async findOne(id: string, userId: string): Promise<BudgetWithUsage> {
    const budget = await this.budgetRepository.findOne({ where: { id } });

    if (!budget) {
      throw new NotFoundException(`Budget with ID ${id} not found`);
    }

    if (budget.userId !== userId) {
      throw new ForbiddenException('You do not have access to this budget');
    }

    return this.calculateUsage(budget, userId);
  }

  async create(
    createBudgetDto: CreateBudgetDto,
    userId: string,
  ): Promise<BudgetWithUsage> {
    const budget = this.budgetRepository.create({
      ...createBudgetDto,
      userId,
      period: createBudgetDto.period || BudgetPeriod.MONTHLY,
    });

    const savedBudget = await this.budgetRepository.save(budget);
    return this.calculateUsage(savedBudget, userId);
  }

  async update(
    id: string,
    updateBudgetDto: UpdateBudgetDto,
    userId: string,
  ): Promise<BudgetWithUsage> {
    const budget = await this.findOne(id, userId);

    Object.assign(budget, updateBudgetDto);

    const savedBudget = await this.budgetRepository.save(budget);
    return this.calculateUsage(savedBudget, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const budget = await this.findOne(id, userId);
    await this.budgetRepository.remove(budget);
  }

  private async calculateUsage(
    budget: Budget,
    userId: string,
  ): Promise<BudgetWithUsage> {
    const dateRange = this.getPeriodDateRange(budget.period);
    const numericLimit =
      typeof budget.limit === 'string' ? parseFloat(budget.limit) : budget.limit;

    // Get all expense transactions for this category in the period
    const { data: transactions } = await this.transactionsService.findAll(
      userId,
      {
        category: budget.category,
        type: TransactionType.EXPENSE,
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
      },
    );

    // Calculate total used amount
    const used = transactions.reduce((sum, transaction) => {
      const amount =
        typeof transaction.amount === 'string'
          ? parseFloat(transaction.amount)
          : transaction.amount;
      return sum + amount;
    }, 0);

    const remaining = Math.max(0, numericLimit - used);
    const usagePercentage = numericLimit > 0 ? (used / numericLimit) * 100 : 0;

    return {
      ...budget,
      used,
      remaining,
      usagePercentage: Math.round(usagePercentage * 100) / 100, // Round to 2 decimal places
    };
  }

  private getPeriodDateRange(period: BudgetPeriod): {
    start: Date;
    end: Date;
  } {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (period) {
      case BudgetPeriod.DAILY:
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;

      case BudgetPeriod.WEEKLY:
        start = new Date(now);
        const dayOfWeek = start.getDay();
        const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;

      case BudgetPeriod.MONTHLY:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;

      case BudgetPeriod.YEARLY:
        start = new Date(now.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(now.getFullYear(), 11, 31);
        end.setHours(23, 59, 59, 999);
        break;

      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  }
}
