import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Wallet } from '../entities/wallet.entity';
import { Transaction, TransactionType } from '../entities/transaction.entity';
import { Budget, BudgetPeriod } from '../entities/budget.entity';
import { Goal } from '../entities/goal.entity';
import { Investment } from '../entities/investment.entity';
import { CurrencyRate } from '../entities/currency-rate.entity';

export async function seedDatabase(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);
  const walletRepository = dataSource.getRepository(Wallet);
  const transactionRepository = dataSource.getRepository(Transaction);
  const budgetRepository = dataSource.getRepository(Budget);
  const goalRepository = dataSource.getRepository(Goal);
  const investmentRepository = dataSource.getRepository(Investment);
  const currencyRateRepository = dataSource.getRepository(CurrencyRate);

  // Check if data already exists
  const existingUser = await userRepository.findOne({
    where: { email: 'test@example.com' },
  });
  if (existingUser) {
    console.log('Seed data already exists. Skipping...');
    return;
  }

  // Create test user
  // Note: In production, password should be hashed with bcrypt
  // For testing purposes, using plain text (will be hashed when auth module is implemented)
  const user = userRepository.create({
    email: 'test@example.com',
    password: 'password123', // TODO: Hash with bcrypt when auth module is ready
  });
  await userRepository.save(user);

  // Create wallets
  const rubWallet = walletRepository.create({
    userId: user.id,
    name: 'Основной кошелёк',
    currency: 'RUB',
    balance: 50000,
  });
  await walletRepository.save(rubWallet);

  const usdWallet = walletRepository.create({
    userId: user.id,
    name: 'USD Wallet',
    currency: 'USD',
    balance: 1000,
  });
  await walletRepository.save(usdWallet);

  // Create transactions
  const transactions = [
    {
      userId: user.id,
      walletId: rubWallet.id,
      amount: 5000,
      type: TransactionType.INCOME,
      category: 'Зарплата',
      tags: ['работа', 'зарплата'],
      description: 'Декабрьская зарплата',
      date: new Date('2024-12-01'),
    },
    {
      userId: user.id,
      walletId: rubWallet.id,
      amount: 2000,
      type: TransactionType.EXPENSE,
      category: 'Продукты',
      tags: ['еда', 'покупки'],
      description: 'Продукты на неделю',
      date: new Date('2024-12-05'),
    },
    {
      userId: user.id,
      walletId: rubWallet.id,
      amount: 1500,
      type: TransactionType.EXPENSE,
      category: 'Транспорт',
      tags: ['транспорт'],
      description: 'Проездной на месяц',
      date: new Date('2024-12-10'),
    },
  ];

  for (const transactionData of transactions) {
    const transaction = transactionRepository.create(transactionData);
    await transactionRepository.save(transaction);
  }

  // Create budgets
  const budgets = [
    {
      userId: user.id,
      category: 'Продукты',
      limit: 5000,
      period: BudgetPeriod.MONTHLY,
    },
    {
      userId: user.id,
      category: 'Развлечения',
      limit: 3000,
      period: BudgetPeriod.MONTHLY,
    },
  ];

  for (const budgetData of budgets) {
    const budget = budgetRepository.create(budgetData);
    await budgetRepository.save(budget);
  }

  // Create goals
  const goal = goalRepository.create({
    userId: user.id,
    name: 'Накопить на отпуск',
    targetAmount: 100000,
    currentAmount: 50000,
    deadline: new Date('2025-06-01'),
    interestRate: 5.5,
  });
  await goalRepository.save(goal);

  // Create investments
  const investment = investmentRepository.create({
    userId: user.id,
    assetName: 'S&P 500 ETF',
    quantity: 10,
    purchasePrice: 4000,
    currentPrice: 4200,
    purchaseDate: new Date('2024-01-15'),
  });
  await investmentRepository.save(investment);

  // Create currency rates
  const currencyRates = [
    { fromCurrency: 'USD', toCurrency: 'RUB', rate: 92.5 },
    { fromCurrency: 'EUR', toCurrency: 'RUB', rate: 100.2 },
    { fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.083 },
  ];

  for (const rateData of currencyRates) {
    const rate = currencyRateRepository.create(rateData);
    await currencyRateRepository.save(rate);
  }

  console.log('Seed data created successfully!');
}

