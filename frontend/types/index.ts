// API Response types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
  };
}

// Wallet types
export interface Wallet {
  id: string;
  userId: string;
  name: string;
  currency: string;
  balance: string;
  createdAt: string;
}

export interface CreateWalletDto {
  name: string;
  currency: string;
}

export interface UpdateWalletDto {
  name?: string;
  currency?: string;
}

// Transaction types
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  userId: string;
  walletId: string;
  amount: string;
  type: TransactionType;
  category: string;
  tags: string[];
  description?: string;
  date: string;
  createdAt: string;
}

export interface CreateTransactionDto {
  walletId: string;
  amount: number;
  type: TransactionType;
  category: string;
  tags?: string[];
  description?: string;
  date: string;
}

export interface UpdateTransactionDto {
  walletId?: string;
  amount?: number;
  type?: TransactionType;
  category?: string;
  tags?: string[];
  description?: string;
  date?: string;
}

export interface FilterTransactionDto {
  walletId?: string;
  type?: TransactionType;
  category?: string;
  tags?: string[];
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// Budget types
export type BudgetPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Budget {
  id: string;
  userId: string;
  category: string;
  limit: string;
  period: BudgetPeriod;
  used?: string;
  remaining?: string;
  usagePercentage?: number;
  createdAt: string;
}

export interface CreateBudgetDto {
  category: string;
  limit: number;
  period: BudgetPeriod;
}

export interface UpdateBudgetDto {
  category?: string;
  limit?: number;
  period?: BudgetPeriod;
}

// Goal types
export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  deadline: string;
  interestRate: string;
  progressPercentage?: number;
  remainingAmount?: string;
  daysRemaining?: number;
  projectedAmount?: string;
  projectedProgress?: number;
  isOnTrack?: boolean;
  createdAt: string;
}

export interface CreateGoalDto {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  deadline: string;
  interestRate?: number;
}

export interface UpdateGoalDto {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  deadline?: string;
  interestRate?: number;
}

// Investment types
export interface Investment {
  id: string;
  userId: string;
  assetName: string;
  quantity: string;
  purchasePrice: string;
  currentPrice: string;
  purchaseDate: string;
  totalValue?: string;
  totalCost?: string;
  profitLoss?: string;
  profitLossPercentage?: number;
  createdAt: string;
}

export interface CreateInvestmentDto {
  assetName: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: string;
}

export interface UpdateInvestmentDto {
  assetName?: string;
  quantity?: number;
  purchasePrice?: number;
  currentPrice?: number;
  purchaseDate?: string;
}

// Currency types
export interface CurrencyRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  createdAt: string;
  updatedAt: string;
}

// Analytics types
export interface AnalyticsOverview {
  totalIncome: string;
  totalExpense: string;
  netBalance: string;
  walletCount: number;
  transactionCount: number;
}

export interface IncomeExpenseData {
  income: string;
  expense: string;
  net: string;
  period: string;
}

export interface CategoryData {
  category: string;
  total: string;
  count: number;
}

export interface TrendData {
  date: string;
  income: string;
  expense: string;
}

// Article types
export interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  readCount: number;
  createdAt: string;
}

