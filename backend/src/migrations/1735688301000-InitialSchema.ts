import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1735688301000 implements MigrationInterface {
  name = 'InitialSchema1735688301000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(
      `CREATE TYPE "public"."transactions_type_enum" AS ENUM('income', 'expense')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."budgets_period_enum" AS ENUM('daily', 'weekly', 'monthly', 'yearly')`,
    );

    // Create users table
    await queryRunner.query(
      `CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )`,
    );

    // Create wallets table
    await queryRunner.query(
      `CREATE TABLE "wallets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "name" character varying NOT NULL,
        "currency" character varying(3) NOT NULL DEFAULT 'RUB',
        "balance" numeric(15,2) NOT NULL DEFAULT '0',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wallets" PRIMARY KEY ("id")
      )`,
    );

    // Create transactions table
    await queryRunner.query(
      `CREATE TABLE "transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "walletId" uuid NOT NULL,
        "amount" numeric(15,2) NOT NULL,
        "type" "public"."transactions_type_enum" NOT NULL,
        "category" character varying NOT NULL,
        "tags" text array NOT NULL DEFAULT '{}',
        "description" text,
        "date" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transactions" PRIMARY KEY ("id")
      )`,
    );

    // Create budgets table
    await queryRunner.query(
      `CREATE TABLE "budgets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "category" character varying NOT NULL,
        "limit" numeric(15,2) NOT NULL,
        "period" "public"."budgets_period_enum" NOT NULL DEFAULT 'monthly',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_budgets" PRIMARY KEY ("id")
      )`,
    );

    // Create goals table
    await queryRunner.query(
      `CREATE TABLE "goals" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "name" character varying NOT NULL,
        "targetAmount" numeric(15,2) NOT NULL,
        "currentAmount" numeric(15,2) NOT NULL DEFAULT '0',
        "deadline" TIMESTAMP NOT NULL,
        "interestRate" numeric(5,2) NOT NULL DEFAULT '0',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_goals" PRIMARY KEY ("id")
      )`,
    );

    // Create investments table
    await queryRunner.query(
      `CREATE TABLE "investments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "assetName" character varying NOT NULL,
        "quantity" numeric(15,2) NOT NULL,
        "purchasePrice" numeric(15,2) NOT NULL,
        "currentPrice" numeric(15,2) NOT NULL,
        "purchaseDate" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_investments" PRIMARY KEY ("id")
      )`,
    );

    // Create currency_rates table
    await queryRunner.query(
      `CREATE TABLE "currency_rates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fromCurrency" character varying(3) NOT NULL,
        "toCurrency" character varying(3) NOT NULL,
        "rate" numeric(15,6) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_currency_rates" PRIMARY KEY ("id")
      )`,
    );

    // Create indexes
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_currency_rates_pair" ON "currency_rates" ("fromCurrency", "toCurrency")`,
    );

    // Create foreign keys
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD CONSTRAINT "FK_wallets_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_transactions_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_transactions_walletId" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgets" ADD CONSTRAINT "FK_budgets_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "goals" ADD CONSTRAINT "FK_goals_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "investments" ADD CONSTRAINT "FK_investments_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(
      `ALTER TABLE "investments" DROP CONSTRAINT "FK_investments_userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "goals" DROP CONSTRAINT "FK_goals_userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgets" DROP CONSTRAINT "FK_budgets_userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_transactions_walletId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_transactions_userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP CONSTRAINT "FK_wallets_userId"`,
    );

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_currency_rates_pair"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "currency_rates"`);
    await queryRunner.query(`DROP TABLE "investments"`);
    await queryRunner.query(`DROP TABLE "goals"`);
    await queryRunner.query(`DROP TABLE "budgets"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TABLE "wallets"`);
    await queryRunner.query(`DROP TABLE "users"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "public"."budgets_period_enum"`);
    await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
  }
}
