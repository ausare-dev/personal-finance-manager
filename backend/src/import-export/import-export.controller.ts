import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  Body,
  Query,
  Res,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response, Request } from 'express';
import { ImportExportService } from './import-export.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('import-export')
export class ImportExportController {
  constructor(private readonly importExportService: ImportExportService) {}

  @Post('csv')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @CurrentUser() user: { id: string },
  ) {
    if (!file) {
      return {
        error: 'File is required',
      };
    }

    if (!file.mimetype.includes('csv') && !file.originalname.endsWith('.csv')) {
      return {
        error: 'File must be a CSV file',
      };
    }

    // Извлекаем walletId из body (FormData)
    const walletId = (req.body && req.body.walletId) ? req.body.walletId : undefined;

    const result = await this.importExportService.importFromCsv(file, user.id, walletId);
    return result;
  }

  @Post('excel')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @CurrentUser() user: { id: string },
  ) {
    if (!file) {
      return {
        error: 'File is required',
      };
    }

    const isExcel =
      file.mimetype.includes('excel') ||
      file.mimetype.includes('spreadsheet') ||
      file.originalname.endsWith('.xlsx') ||
      file.originalname.endsWith('.xls');

    if (!isExcel) {
      return {
        error: 'File must be an Excel file (.xlsx or .xls)',
      };
    }

    // Извлекаем walletId из body (FormData)
    const walletId = (req.body && req.body.walletId) ? req.body.walletId : undefined;

    const result = await this.importExportService.importFromExcel(file, user.id, walletId);
    return result;
  }

  @Get('csv')
  async exportCsv(
    @CurrentUser() user: { id: string },
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const csvContent = await this.importExportService.exportToCsv(user.id, start, end);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    res.send(csvContent);
  }

  @Get('excel')
  async exportExcel(
    @CurrentUser() user: { id: string },
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const excelBuffer = await this.importExportService.exportToExcel(user.id, start, end);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.xlsx');
    res.send(excelBuffer);
  }
}

