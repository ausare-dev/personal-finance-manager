import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '../entities/wallet.entity';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
  ) {}

  async findAll(userId: string): Promise<Wallet[]> {
    return this.walletRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({ where: { id } });
    
    if (!wallet) {
      throw new NotFoundException(`Wallet with ID ${id} not found`);
    }

    if (wallet.userId !== userId) {
      throw new ForbiddenException('You do not have access to this wallet');
    }

    return wallet;
  }

  async create(createWalletDto: CreateWalletDto, userId: string): Promise<Wallet> {
    const wallet = this.walletRepository.create({
      ...createWalletDto,
      userId,
      currency: createWalletDto.currency || 'RUB',
      balance: 0,
    });

    return this.walletRepository.save(wallet);
  }

  async update(
    id: string,
    updateWalletDto: UpdateWalletDto,
    userId: string,
  ): Promise<Wallet> {
    const wallet = await this.findOne(id, userId);

    Object.assign(wallet, updateWalletDto);

    return this.walletRepository.save(wallet);
  }

  async remove(id: string, userId: string): Promise<void> {
    const wallet = await this.findOne(id, userId);
    await this.walletRepository.remove(wallet);
  }
}

