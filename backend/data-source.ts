import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';
import {
  User,
  Wallet,
  Transaction,
  Budget,
  Goal,
  Investment,
  CurrencyRate,
  Article,
} from './src/entities/index';

config({ path: path.resolve(__dirname, '.env') });

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'pfm_db',
  entities: [User, Wallet, Transaction, Budget, Goal, Investment, CurrencyRate, Article],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  logging: true,
});
