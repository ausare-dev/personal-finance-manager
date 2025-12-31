import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Investment } from '../entities/investment.entity';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';

export interface InvestmentWithMetrics extends Investment {
  totalValue: number; // Текущая стоимость: quantity * currentPrice
  totalCost: number; // Стоимость покупки: quantity * purchasePrice
  profitLoss: number; // Прибыль/убыток: totalValue - totalCost
  profitLossPercentage: number; // Процент доходности: (profitLoss / totalCost) * 100
}

export interface PortfolioSummary {
  totalInvestments: number;
  totalValue: number; // Общая текущая стоимость портфеля
  totalCost: number; // Общая стоимость покупки
  totalProfitLoss: number; // Общая прибыль/убыток
  totalProfitLossPercentage: number; // Общий процент доходности
  investments: InvestmentWithMetrics[];
}

@Injectable()
export class InvestmentsService {
  constructor(
    @InjectRepository(Investment)
    private investmentRepository: Repository<Investment>,
  ) {}

  async findAll(userId: string): Promise<InvestmentWithMetrics[]> {
    const investments = await this.investmentRepository.find({
      where: { userId },
      order: { purchaseDate: 'DESC' },
    });

    return investments.map((investment) =>
      this.calculateMetrics(investment),
    );
  }

  async getPortfolio(userId: string): Promise<PortfolioSummary> {
    const investments = await this.findAll(userId);

    const totalValue = investments.reduce(
      (sum, inv) => sum + inv.totalValue,
      0,
    );
    const totalCost = investments.reduce(
      (sum, inv) => sum + inv.totalCost,
      0,
    );
    const totalProfitLoss = totalValue - totalCost;
    const totalProfitLossPercentage =
      totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

    return {
      totalInvestments: investments.length,
      totalValue: Math.round(totalValue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      totalProfitLoss: Math.round(totalProfitLoss * 100) / 100,
      totalProfitLossPercentage: Math.round(totalProfitLossPercentage * 100) / 100,
      investments,
    };
  }

  async findOne(
    id: string,
    userId: string,
  ): Promise<InvestmentWithMetrics> {
    const investment = await this.investmentRepository.findOne({
      where: { id },
    });

    if (!investment) {
      throw new NotFoundException(`Investment with ID ${id} not found`);
    }

    if (investment.userId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this investment',
      );
    }

    return this.calculateMetrics(investment);
  }

  async create(
    createInvestmentDto: CreateInvestmentDto,
    userId: string,
  ): Promise<InvestmentWithMetrics> {
    const investment = this.investmentRepository.create({
      ...createInvestmentDto,
      userId,
      purchaseDate: new Date(createInvestmentDto.purchaseDate),
    });

    const savedInvestment = await this.investmentRepository.save(investment);
    return this.calculateMetrics(savedInvestment);
  }

  async update(
    id: string,
    updateInvestmentDto: UpdateInvestmentDto,
    userId: string,
  ): Promise<InvestmentWithMetrics> {
    const investment = await this.investmentRepository.findOne({
      where: { id },
    });

    if (!investment) {
      throw new NotFoundException(`Investment with ID ${id} not found`);
    }

    if (investment.userId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this investment',
      );
    }

    Object.assign(investment, {
      ...updateInvestmentDto,
      purchaseDate: updateInvestmentDto.purchaseDate
        ? new Date(updateInvestmentDto.purchaseDate)
        : investment.purchaseDate,
    });

    const updatedInvestment =
      await this.investmentRepository.save(investment);
    return this.calculateMetrics(updatedInvestment);
  }

  async remove(id: string, userId: string): Promise<void> {
    const investment = await this.investmentRepository.findOne({
      where: { id },
    });

    if (!investment) {
      throw new NotFoundException(`Investment with ID ${id} not found`);
    }

    if (investment.userId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this investment',
      );
    }

    await this.investmentRepository.remove(investment);
  }

  private calculateMetrics(
    investment: Investment,
  ): InvestmentWithMetrics {
    const numericQuantity = parseFloat(investment.quantity.toString());
    const numericPurchasePrice = parseFloat(
      investment.purchasePrice.toString(),
    );
    const numericCurrentPrice = parseFloat(investment.currentPrice.toString());

    const totalCost = numericQuantity * numericPurchasePrice;
    const totalValue = numericQuantity * numericCurrentPrice;
    const profitLoss = totalValue - totalCost;
    const profitLossPercentage =
      totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

    return {
      ...investment,
      totalCost: Math.round(totalCost * 100) / 100,
      totalValue: Math.round(totalValue * 100) / 100,
      profitLoss: Math.round(profitLoss * 100) / 100,
      profitLossPercentage: Math.round(profitLossPercentage * 100) / 100,
    };
  }
}

