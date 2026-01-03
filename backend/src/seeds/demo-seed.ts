import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Wallet } from '../entities/wallet.entity';
import { Transaction, TransactionType } from '../entities/transaction.entity';
import { Budget, BudgetPeriod } from '../entities/budget.entity';
import { Goal } from '../entities/goal.entity';
import { Investment } from '../entities/investment.entity';
import { CurrencyRate } from '../entities/currency-rate.entity';
import * as bcrypt from 'bcrypt';

export async function seedDemoData(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);
  const walletRepository = dataSource.getRepository(Wallet);
  const transactionRepository = dataSource.getRepository(Transaction);
  const budgetRepository = dataSource.getRepository(Budget);
  const goalRepository = dataSource.getRepository(Goal);
  const investmentRepository = dataSource.getRepository(Investment);
  const currencyRateRepository = dataSource.getRepository(CurrencyRate);

  // Check if demo user already exists and delete if exists to recreate with fresh data
  const existingDemoUser = await userRepository.findOne({
    where: { email: 'demo@example.com' },
    relations: ['wallets', 'transactions', 'budgets', 'goals', 'investments'],
  });
  if (existingDemoUser) {
    console.log('Demo user already exists. Deleting old demo data...');
    // Delete related data first (CASCADE should handle this, but let's be explicit)
    await transactionRepository.delete({ userId: existingDemoUser.id });
    await walletRepository.delete({ userId: existingDemoUser.id });
    await budgetRepository.delete({ userId: existingDemoUser.id });
    await goalRepository.delete({ userId: existingDemoUser.id });
    await investmentRepository.delete({ userId: existingDemoUser.id });
    await userRepository.delete({ id: existingDemoUser.id });
    console.log('Old demo data deleted.');
  }

  // Create demo user with hashed password
  const hashedPassword = await bcrypt.hash('demo123', 10);
  const demoUser = userRepository.create({
    email: 'demo@example.com',
    password: hashedPassword,
  });
  await userRepository.save(demoUser);

  console.log('Creating demo user...');

  // Create wallets for demo user
  const rubWallet = walletRepository.create({
    userId: demoUser.id,
    name: 'Основной кошелёк',
    currency: 'RUB',
    balance: 125000,
  });
  await walletRepository.save(rubWallet);

  const usdWallet = walletRepository.create({
    userId: demoUser.id,
    name: 'USD Сбережения',
    currency: 'USD',
    balance: 2500,
  });
  await walletRepository.save(usdWallet);

  const eurWallet = walletRepository.create({
    userId: demoUser.id,
    name: 'EUR Вклад',
    currency: 'EUR',
    balance: 1500,
  });
  await walletRepository.save(eurWallet);

  console.log('Creating demo wallets...');

  // Create transactions for demo user (last 3 months)
  const now = new Date();
  const transactions: Array<{
    userId: string;
    walletId: string;
    amount: number;
    type: TransactionType;
    category: string;
    tags: string[];
    description: string;
    date: Date;
  }> = [];

  // Income transactions
  transactions.push(
    {
      userId: demoUser.id,
      walletId: rubWallet.id,
      amount: 150000,
      type: TransactionType.INCOME,
      category: 'Зарплата',
      tags: ['работа', 'зарплата', 'основной доход'],
      description: 'Зарплата за ноябрь',
      date: new Date(now.getFullYear(), now.getMonth() - 1, 5),
    },
    {
      userId: demoUser.id,
      walletId: rubWallet.id,
      amount: 150000,
      type: TransactionType.INCOME,
      category: 'Зарплата',
      tags: ['работа', 'зарплата', 'основной доход'],
      description: 'Зарплата за октябрь',
      date: new Date(now.getFullYear(), now.getMonth() - 2, 5),
    },
    {
      userId: demoUser.id,
      walletId: rubWallet.id,
      amount: 150000,
      type: TransactionType.INCOME,
      category: 'Зарплата',
      tags: ['работа', 'зарплата', 'основной доход'],
      description: 'Зарплата за сентябрь',
      date: new Date(now.getFullYear(), now.getMonth() - 3, 5),
    },
    {
      userId: demoUser.id,
      walletId: rubWallet.id,
      amount: 25000,
      type: TransactionType.INCOME,
      category: 'Фриланс',
      tags: ['работа', 'фриланс', 'дополнительный доход'],
      description: 'Разработка веб-сайта',
      date: new Date(now.getFullYear(), now.getMonth() - 1, 15),
    },
    {
      userId: demoUser.id,
      walletId: usdWallet.id,
      amount: 500,
      type: TransactionType.INCOME,
      category: 'Инвестиции',
      tags: ['инвестиции', 'дивиденды'],
      description: 'Дивиденды по акциям',
      date: new Date(now.getFullYear(), now.getMonth() - 1, 20),
    },
  );

  // Expense transactions - Food
  transactions.push(
    {
      userId: demoUser.id,
      walletId: rubWallet.id,
      amount: 8500,
      type: TransactionType.EXPENSE,
      category: 'Продукты',
      tags: ['еда', 'покупки', 'продукты'],
      description: 'Продукты на неделю',
      date: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    },
    {
      userId: demoUser.id,
      walletId: rubWallet.id,
      amount: 9200,
      type: TransactionType.EXPENSE,
      category: 'Продукты',
      tags: ['еда', 'покупки', 'продукты'],
      description: 'Большая закупка продуктов',
      date: new Date(now.getFullYear(), now.getMonth() - 1, 15),
    },
    {
      userId: demoUser.id,
      walletId: rubWallet.id,
      amount: 7800,
      type: TransactionType.EXPENSE,
      category: 'Продукты',
      tags: ['еда', 'покупки', 'продукты'],
      description: 'Продукты',
      date: new Date(now.getFullYear(), now.getMonth() - 1, 28),
    },
    {
      userId: demoUser.id,
      walletId: rubWallet.id,
      amount: 1200,
      type: TransactionType.EXPENSE,
      category: 'Кафе и рестораны',
      tags: ['еда', 'ресторан', 'развлечения'],
      description: 'Ужин в ресторане',
      date: new Date(now.getFullYear(), now.getMonth() - 1, 10),
    },
    {
      userId: demoUser.id,
      walletId: rubWallet.id,
      amount: 850,
      type: TransactionType.EXPENSE,
      category: 'Кафе и рестораны',
      tags: ['еда', 'кафе', 'кофе'],
      description: 'Кофе и завтрак',
      date: new Date(now.getFullYear(), now.getMonth() - 1, 18),
    },
  );

  // Expense transactions - Transport
  transactions.push(
    {
      userId: demoUser.id,
      walletId: rubWallet.id,
      amount: 2500,
      type: TransactionType.EXPENSE,
      category: 'Транспорт',
      tags: ['транспорт', 'проездной'],
      description: 'Проездной на месяц',
      date: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    },
    {
      userId: demoUser.id,
      walletId: rubWallet.id,
      amount: 350,
      type: TransactionType.EXPENSE,
      category: 'Транспорт',
      tags: ['транспорт', 'такси'],
      description: 'Поездка на такси',
      date: new Date(now.getFullYear(), now.getMonth() - 1, 12),
    },
    {
      userId: demoUser.id,
      walletId: rubWallet.id,
      amount: 450,
      type: TransactionType.EXPENSE,
      category: 'Транспорт',
      tags: ['транспорт', 'бензин'],
      description: 'Заправка автомобиля',
      date: new Date(now.getFullYear(), now.getMonth() - 1, 20),
    },
  );

  // Expense transactions - Entertainment
  transactions.push(
    {
      userId: demoUser.id,
      walletId: rubWallet.id,
      amount: 2500,
      type: TransactionType.EXPENSE,
      category: 'Развлечения',
      tags: ['развлечения', 'кино'],
      description: 'Поход в кино',
      date: new Date(now.getFullYear(), now.getMonth() - 1, 8),
    },
    {
      userId: demoUser.id,
      walletId: rubWallet.id,
      amount: 3500,
      type: TransactionType.EXPENSE,
      category: 'Развлечения',
      tags: ['развлечения', 'концерт'],
      description: 'Концерт',
      date: new Date(now.getFullYear(), now.getMonth() - 1, 22),
    },
    {
      userId: demoUser.id,
      walletId: rubWallet.id,
      amount: 1200,
      type: TransactionType.EXPENSE,
      category: 'Развлечения',
      tags: ['развлечения', 'игры'],
      description: 'Подписка на игры',
      date: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    },
  );

  // Expense transactions - Health
  transactions.push(
    {
      userId: demoUser.id,
      walletId: rubWallet.id,
      amount: 5000,
      type: TransactionType.EXPENSE,
      category: 'Здоровье',
      tags: ['здоровье', 'медицина'],
      description: 'Посещение врача',
      date: new Date(now.getFullYear(), now.getMonth() - 1, 14),
    },
    {
      userId: demoUser.id,
      walletId: rubWallet.id,
      amount: 3200,
      type: TransactionType.EXPENSE,
      category: 'Здоровье',
      tags: ['здоровье', 'лекарства'],
      description: 'Покупка лекарств',
      date: new Date(now.getFullYear(), now.getMonth() - 1, 16),
    },
  );

  // Expense transactions - Shopping
  transactions.push(
    {
      userId: demoUser.id,
      walletId: rubWallet.id,
      amount: 15000,
      type: TransactionType.EXPENSE,
      category: 'Одежда',
      tags: ['покупки', 'одежда'],
      description: 'Покупка зимней одежды',
      date: new Date(now.getFullYear(), now.getMonth() - 2, 10),
    },
    {
      userId: demoUser.id,
      walletId: rubWallet.id,
      amount: 8500,
      type: TransactionType.EXPENSE,
      category: 'Электроника',
      tags: ['покупки', 'электроника'],
      description: 'Наушники',
      date: new Date(now.getFullYear(), now.getMonth() - 1, 25),
    },
  );

  // Expense transactions - Utilities
  transactions.push(
    {
      userId: demoUser.id,
      walletId: rubWallet.id,
      amount: 4500,
      type: TransactionType.EXPENSE,
      category: 'Коммунальные услуги',
      tags: ['коммунальные', 'квартплата'],
      description: 'Квартплата за ноябрь',
      date: new Date(now.getFullYear(), now.getMonth() - 1, 3),
    },
    {
      userId: demoUser.id,
      walletId: rubWallet.id,
      amount: 1200,
      type: TransactionType.EXPENSE,
      category: 'Коммунальные услуги',
      tags: ['коммунальные', 'интернет'],
      description: 'Интернет за ноябрь',
      date: new Date(now.getFullYear(), now.getMonth() - 1, 5),
    },
    {
      userId: demoUser.id,
      walletId: rubWallet.id,
      amount: 800,
      type: TransactionType.EXPENSE,
      category: 'Коммунальные услуги',
      tags: ['коммунальные', 'мобильная связь'],
      description: 'Мобильная связь',
      date: new Date(now.getFullYear(), now.getMonth() - 1, 7),
    },
  );

  // Save all transactions
  for (const transactionData of transactions) {
    const transaction = transactionRepository.create(transactionData);
    await transactionRepository.save(transaction);
  }

  console.log(`Created ${transactions.length} demo transactions...`);

  // Create budgets
  const budgets = [
    {
      userId: demoUser.id,
      category: 'Продукты',
      limit: 10000,
      period: BudgetPeriod.MONTHLY,
    },
    {
      userId: demoUser.id,
      category: 'Развлечения',
      limit: 5000,
      period: BudgetPeriod.MONTHLY,
    },
    {
      userId: demoUser.id,
      category: 'Транспорт',
      limit: 3500,
      period: BudgetPeriod.MONTHLY,
    },
    {
      userId: demoUser.id,
      category: 'Здоровье',
      limit: 8000,
      period: BudgetPeriod.MONTHLY,
    },
    {
      userId: demoUser.id,
      category: 'Коммунальные услуги',
      limit: 7000,
      period: BudgetPeriod.MONTHLY,
    },
  ];

  for (const budgetData of budgets) {
    const budget = budgetRepository.create(budgetData);
    await budgetRepository.save(budget);
  }

  console.log(`Created ${budgets.length} demo budgets...`);

  // Create goals
  const goals = [
    {
      userId: demoUser.id,
      name: 'Накопить на отпуск',
      targetAmount: 200000,
      currentAmount: 125000,
      deadline: new Date(now.getFullYear() + 1, 5, 1), // June next year
      interestRate: 5.5,
    },
    {
      userId: demoUser.id,
      name: 'Новый автомобиль',
      targetAmount: 1500000,
      currentAmount: 350000,
      deadline: new Date(now.getFullYear() + 2, 0, 1), // January in 2 years
      interestRate: 6.0,
    },
    {
      userId: demoUser.id,
      name: 'Резервный фонд',
      targetAmount: 500000,
      currentAmount: 180000,
      deadline: new Date(now.getFullYear() + 1, 11, 31), // End of next year
      interestRate: 4.5,
    },
  ];

  for (const goalData of goals) {
    const goal = goalRepository.create(goalData);
    await goalRepository.save(goal);
  }

  console.log(`Created ${goals.length} demo goals...`);

  // Create investments
  const investments = [
    {
      userId: demoUser.id,
      assetName: 'S&P 500 ETF',
      quantity: 25,
      purchasePrice: 4000,
      currentPrice: 4250,
      purchaseDate: new Date(now.getFullYear() - 1, 0, 15),
    },
    {
      userId: demoUser.id,
      assetName: 'NASDAQ ETF',
      quantity: 15,
      purchasePrice: 3500,
      currentPrice: 3800,
      purchaseDate: new Date(now.getFullYear() - 1, 2, 10),
    },
    {
      userId: demoUser.id,
      assetName: 'Облигации',
      quantity: 100,
      purchasePrice: 1000,
      currentPrice: 1020,
      purchaseDate: new Date(now.getFullYear() - 1, 5, 20),
    },
    {
      userId: demoUser.id,
      assetName: 'Акции Apple',
      quantity: 10,
      purchasePrice: 150,
      currentPrice: 175,
      purchaseDate: new Date(now.getFullYear() - 1, 8, 5),
    },
  ];

  for (const investmentData of investments) {
    const investment = investmentRepository.create(investmentData);
    await investmentRepository.save(investment);
  }

  console.log(`Created ${investments.length} demo investments...`);

  // Ensure currency rates exist (they might be created by initial-seed)
  const existingRates = await currencyRateRepository.find();
  if (existingRates.length === 0) {
    const currencyRates = [
      { fromCurrency: 'USD', toCurrency: 'RUB', rate: 92.5 },
      { fromCurrency: 'EUR', toCurrency: 'RUB', rate: 100.2 },
      { fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.083 },
      { fromCurrency: 'RUB', toCurrency: 'USD', rate: 0.0108 },
      { fromCurrency: 'RUB', toCurrency: 'EUR', rate: 0.00998 },
      { fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.923 },
    ];

    for (const rateData of currencyRates) {
      const rate = currencyRateRepository.create(rateData);
      await currencyRateRepository.save(rate);
    }
  }

  console.log('Demo data created successfully!');
  console.log('Demo account credentials:');
  console.log('  Email: demo@example.com');
  console.log('  Password: demo123');
}

