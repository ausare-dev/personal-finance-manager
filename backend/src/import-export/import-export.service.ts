import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Transaction, TransactionType } from '../entities/transaction.entity';
import { WalletsService } from '../wallets/wallets.service';
import { TransactionsService } from '../transactions/transactions.service';
import { ImportTransactionDto } from './dto/import-transaction.dto';

export interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}

@Injectable()
export class ImportExportService {
  private readonly logger = new Logger(ImportExportService.name);

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private walletsService: WalletsService,
    private transactionsService: TransactionsService,
  ) {}

  /**
   * Импорт транзакций из CSV
   */
  async importFromCsv(
    file: Express.Multer.File,
    userId: string,
    defaultWalletId?: string,
  ): Promise<ImportResult> {
    try {
      const csvContent = file.buffer.toString('utf-8');
      const parseResult = Papa.parse<any>(csvContent, {
        header: true,
        skipEmptyLines: true,
      });

      if (parseResult.errors.length > 0) {
        const errMsg = parseResult.errors
          .map((e: { message?: string }) => e.message ?? '')
          .join(', ');
        throw new BadRequestException(`CSV parsing errors: ${errMsg}`);
      }

      return this.processImportData(
        parseResult.data as Record<string, unknown>[],
        userId,
        defaultWalletId,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`CSV import failed: ${msg}`);
      throw new BadRequestException(`Failed to import CSV: ${msg}`);
    }
  }

  /**
   * Импорт транзакций из Excel
   */
  async importFromExcel(
    file: Express.Multer.File,
    userId: string,
    defaultWalletId?: string,
  ): Promise<ImportResult> {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Конвертировать в JSON
      const data = XLSX.utils.sheet_to_json(worksheet);

      return this.processImportData(data, userId, defaultWalletId);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Excel import failed: ${msg}`);
      throw new BadRequestException(`Failed to import Excel: ${msg}`);
    }
  }

  /**
   * Обработка импортируемых данных
   */
  private async processImportData(
    data: Record<string, unknown>[],
    userId: string,
    defaultWalletId?: string,
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 because row 1 is header and array is 0-indexed

      try {
        // Валидация и преобразование данных
        const transactionData = this.validateAndTransformRow(
          row,
          rowNumber,
          defaultWalletId,
        );

        // Создать транзакцию
        await this.transactionsService.create(transactionData, userId);
        result.success++;
      } catch (err: unknown) {
        result.failed++;
        let errorMessage = 'Неизвестная ошибка';

        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (err && typeof err === 'object') {
          const e = err as {
            message?: string;
            response?: { message?: string | string[] };
            status?: number;
          };
          if (typeof e.message === 'string') {
            errorMessage = e.message;
          } else if (e.response && e.response.message) {
            errorMessage = Array.isArray(e.response.message)
              ? e.response.message.join(', ')
              : String(e.response.message);
          } else if (e.status === 404) {
            errorMessage = 'Ресурс не найден';
          } else if (e.status === 403) {
            errorMessage = 'Доступ запрещен';
          }
        } else if (typeof err === 'string') {
          errorMessage = err;
        }

        // PostgreSQL UUID and other server errors
        if (
          errorMessage.includes('invalid input syntax for type uuid') ||
          errorMessage.includes('uuid')
        ) {
          errorMessage =
            'ID кошелька должен быть в формате UUID. Убедитесь, что вы скопировали правильный ID кошелька со страницы "Кошельки" и заменили все вхождения "WALLET_ID_HERE" в файле.';
        }

        // Добавляем контекст для ошибок валидации walletId
        if (
          errorMessage.includes('walletId') ||
          errorMessage.includes('Wallet') ||
          errorMessage.includes('not found') ||
          errorMessage.includes('не найден') ||
          errorMessage.includes('ID кошелька')
        ) {
          // Не дублируем сообщение, если уже было обработано выше
          if (!errorMessage.includes('формате UUID')) {
            errorMessage = `Некорректный ID кошелька. Убедитесь, что используете существующий ID кошелька, принадлежащий вашему аккаунту. Детали: ${errorMessage}`;
          }
        }

        // Добавляем контекст для ошибок валидации типа
        if (
          errorMessage.includes('type must be') ||
          errorMessage.includes('TransactionType')
        ) {
          errorMessage = `Некорректный тип транзакции. Используйте 'income' (доход) или 'expense' (расход). Детали: ${errorMessage}`;
        }

        // Добавляем контекст для ошибок валидации суммы
        if (
          errorMessage.includes('amount') ||
          errorMessage.includes('number')
        ) {
          errorMessage = `Некорректная сумма транзакции. Должно быть положительное число. Детали: ${errorMessage}`;
        }

        result.errors.push({
          row: rowNumber,
          message: errorMessage,
        });
      }
    }

    return result;
  }

  /**
   * Валидация и преобразование строки данных
   */
  private validateAndTransformRow(
    row: Record<string, unknown>,
    _rowNumber: number,
    defaultWalletId?: string,
  ): ImportTransactionDto {
    const normalizedRow: Record<string, unknown> = {};
    Object.keys(row).forEach((key) => {
      normalizedRow[key.toLowerCase().trim()] = row[key];
    });

    const raw = (k: string): unknown => normalizedRow[k];
    const rawStr = (k: string): string => {
      const v = raw(k);
      if (v == null) return '';
      if (typeof v === 'string') return v;
      // CSV/Excel cells: numbers, dates, etc. — allow stringify
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      return String(v);
    };
    const w1 = rawStr('walletid') || rawStr('wallet id') || rawStr('wallet');
    let walletIdStr = w1.trim();

    const walletIdUpper = walletIdStr.toUpperCase();
    const isPlaceholder =
      !walletIdStr ||
      walletIdUpper === 'WALLET_ID_HERE' ||
      walletIdUpper === 'WALLETID_HERE' ||
      walletIdUpper === 'WALLET_ID';

    if (isPlaceholder) {
      if (defaultWalletId) {
        this.logger.debug(
          `Replacing placeholder "${walletIdStr}" with defaultWalletId: ${defaultWalletId}`,
        );
        walletIdStr = defaultWalletId;
      } else {
        throw new Error(
          'ID кошелька обязателен. Выберите кошелек в интерфейсе перед импортом.',
        );
      }
    } else {
      this.logger.debug(`Using walletId from file: ${walletIdStr}`);
    }

    const finalWalletId = walletIdStr.trim();
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(finalWalletId)) {
      throw new Error(
        `ID кошелька должен быть в формате UUID. Получено: "${finalWalletId}". Убедитесь, что вы выбрали кошелек в интерфейсе или указали правильный ID в файле.`,
      );
    }

    const amountStr = rawStr('amount');
    if (!amountStr || isNaN(parseFloat(amountStr))) {
      throw new Error('Сумма должна быть валидным числом');
    }
    const typeStr = rawStr('type').trim().toLowerCase();
    if (
      !typeStr ||
      !Object.values(TransactionType).includes(typeStr as TransactionType)
    ) {
      throw new Error(
        `Тип транзакции должен быть одним из: ${Object.values(TransactionType).join(', ')}. Используйте 'income' для дохода или 'expense' для расхода.`,
      );
    }
    const categoryStr = rawStr('category');
    if (!categoryStr) {
      throw new Error('Категория обязательна для заполнения');
    }
    const dateValStr =
      rawStr('date') || rawStr('transactiondate') || rawStr('datetime');
    if (!dateValStr) {
      throw new Error('Дата обязательна для заполнения');
    }

    let parsedDate: Date;
    try {
      parsedDate = new Date(dateValStr);
      if (isNaN(parsedDate.getTime())) {
        throw new Error(
          `Неверный формат даты: "${dateValStr}". Используйте формат ISO 8601, например: 2025-12-01T10:00:00.000Z`,
        );
      }
    } catch {
      throw new Error(
        `Неверный формат даты: "${dateValStr}". Используйте формат ISO 8601, например: 2025-12-01T10:00:00.000Z`,
      );
    }

    const tags = raw('tags') ?? raw('tag');
    let parsedTags: string[] = [];
    if (tags) {
      if (typeof tags === 'string') {
        parsedTags = tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
      } else if (Array.isArray(tags)) {
        parsedTags = tags
          .map((t) => String(t).trim())
          .filter((t) => t.length > 0);
      }
    }

    const descriptionStr =
      rawStr('description') || rawStr('desc') || rawStr('note') || undefined;

    return {
      walletId: finalWalletId,
      amount: parseFloat(amountStr),
      type: typeStr as TransactionType,
      category: categoryStr,
      tags: parsedTags.length > 0 ? parsedTags : undefined,
      description: descriptionStr,
      date: parsedDate.toISOString(),
    };
  }

  /**
   * Экспорт транзакций в CSV
   */
  async exportToCsv(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<string> {
    const transactions = await this.getTransactionsForExport(
      userId,
      startDate,
      endDate,
    );

    // Преобразовать в формат для CSV
    const csvData = transactions.map((t) => ({
      'Wallet ID': t.walletId,
      Amount: t.amount,
      Type: t.type,
      Category: t.category,
      Tags: Array.isArray(t.tags) ? t.tags.join(',') : '',
      Description: t.description || '',
      Date: new Date(t.date).toISOString(),
      'Created At': new Date(t.createdAt).toISOString(),
    }));

    return Papa.unparse(csvData);
  }

  /**
   * Экспорт транзакций в Excel
   */
  async exportToExcel(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Buffer> {
    const transactions = await this.getTransactionsForExport(
      userId,
      startDate,
      endDate,
    );

    // Преобразовать в формат для Excel
    const excelData = transactions.map((t) => ({
      'Wallet ID': t.walletId,
      Amount: parseFloat(t.amount.toString()),
      Type: t.type,
      Category: t.category,
      Tags: Array.isArray(t.tags) ? t.tags.join(',') : '',
      Description: t.description || '',
      Date: new Date(t.date).toISOString(),
      'Created At': new Date(t.createdAt).toISOString(),
    }));

    // Создать рабочую книгу
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Добавить лист в книгу
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

    // Конвертировать в buffer
    return Buffer.from(
      XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }),
    );
  }

  /**
   * Получить транзакции для экспорта
   */
  private async getTransactionsForExport(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Transaction[]> {
    const queryBuilder =
      this.transactionRepository.createQueryBuilder('transaction');

    queryBuilder.where('transaction.userId = :userId', { userId });

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'transaction.date BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    } else if (startDate) {
      queryBuilder.andWhere('transaction.date >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('transaction.date <= :endDate', { endDate });
    }

    return queryBuilder.orderBy('transaction.date', 'DESC').getMany();
  }
}
