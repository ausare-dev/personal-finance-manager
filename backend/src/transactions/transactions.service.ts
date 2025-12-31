import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Transaction, TransactionType } from '../entities/transaction.entity';
import { WalletsService } from '../wallets/wallets.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private walletsService: WalletsService,
  ) {}

  async findAll(
    userId: string,
    filterDto: FilterTransactionDto,
  ): Promise<{ data: Transaction[]; total: number; page: number; limit: number }> {
    const { walletId, type, category, tag, startDate, endDate, page = 1, limit = 10 } = filterDto;

    const queryBuilder = this.transactionRepository.createQueryBuilder('transaction');

    queryBuilder.where('transaction.userId = :userId', { userId });

    if (walletId) {
      queryBuilder.andWhere('transaction.walletId = :walletId', { walletId });
    }

    if (type) {
      queryBuilder.andWhere('transaction.type = :type', { type });
    }

    if (category) {
      queryBuilder.andWhere('transaction.category = :category', { category });
    }

    if (tag) {
      queryBuilder.andWhere(':tag = ANY(transaction.tags)', { tag });
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

    const skip = (page - 1) * limit;

    const [data, total] = await queryBuilder
      .orderBy('transaction.date', 'DESC')
      .addOrderBy('transaction.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, userId: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['wallet'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    if (transaction.userId !== userId) {
      throw new ForbiddenException('You do not have access to this transaction');
    }

    return transaction;
  }

  async create(
    createTransactionDto: CreateTransactionDto,
    userId: string,
  ): Promise<Transaction> {
    // Verify wallet exists and belongs to user
    const wallet = await this.walletsService.findOne(createTransactionDto.walletId, userId);

    const transaction = this.transactionRepository.create({
      ...createTransactionDto,
      userId,
      date: new Date(createTransactionDto.date),
      tags: createTransactionDto.tags || [],
    });

    const savedTransaction = await this.transactionRepository.save(transaction);

    // Update wallet balance
    await this.updateWalletBalance(
      wallet.id,
      savedTransaction.amount,
      savedTransaction.type,
      'add',
      userId,
    );

    return savedTransaction;
  }

  async update(
    id: string,
    updateTransactionDto: UpdateTransactionDto,
    userId: string,
  ): Promise<Transaction> {
    const transaction = await this.findOne(id, userId);
    const oldWallet = await this.walletsService.findOne(transaction.walletId, userId);

    // Revert old transaction's impact on balance
    await this.updateWalletBalance(oldWallet.id, transaction.amount, transaction.type, 'subtract', userId);

    // Update transaction fields
    if (updateTransactionDto.date) {
      transaction.date = new Date(updateTransactionDto.date);
    }
    if (updateTransactionDto.walletId && updateTransactionDto.walletId !== transaction.walletId) {
      // Verify new wallet exists and belongs to user
      await this.walletsService.findOne(updateTransactionDto.walletId, userId);
      transaction.walletId = updateTransactionDto.walletId;
    }

    Object.assign(transaction, {
      ...updateTransactionDto,
      date: updateTransactionDto.date ? new Date(updateTransactionDto.date) : transaction.date,
    });

    const savedTransaction = await this.transactionRepository.save(transaction);

    // Get the wallet that will receive the transaction (might be new wallet)
    const newWallet = await this.walletsService.findOne(savedTransaction.walletId, userId);

    // Apply new transaction's impact on balance
    await this.updateWalletBalance(
      newWallet.id,
      savedTransaction.amount,
      savedTransaction.type,
      'add',
      userId,
    );

    return savedTransaction;
  }

  async remove(id: string, userId: string): Promise<void> {
    const transaction = await this.findOne(id, userId);
    const wallet = await this.walletsService.findOne(transaction.walletId, userId);

    await this.transactionRepository.remove(transaction);

    // Revert transaction's impact on balance
    await this.updateWalletBalance(wallet.id, transaction.amount, transaction.type, 'subtract', userId);
  }

  private async updateWalletBalance(
    walletId: string,
    amount: number,
    type: TransactionType,
    operation: 'add' | 'subtract',
    userId: string,
  ): Promise<void> {
    const wallet = await this.walletsService.findOne(walletId, userId);

    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const numericBalance =
      typeof wallet.balance === 'string' ? parseFloat(wallet.balance) : wallet.balance;

    let newBalance = numericBalance;

    if (operation === 'add') {
      if (type === TransactionType.INCOME) {
        newBalance = numericBalance + numericAmount;
      } else {
        newBalance = numericBalance - numericAmount;
      }
    } else {
      // subtract (revert)
      if (type === TransactionType.INCOME) {
        newBalance = numericBalance - numericAmount;
      } else {
        newBalance = numericBalance + numericAmount;
      }
    }

    await this.walletsService.updateBalance(walletId, newBalance);
  }
}
