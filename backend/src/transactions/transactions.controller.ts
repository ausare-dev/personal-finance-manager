import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createTransactionDto: CreateTransactionDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.transactionsService.create(createTransactionDto, user.id);
  }

  @Get()
  findAll(
    @Query() filterDto: FilterTransactionDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.transactionsService.findAll(user.id, filterDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.transactionsService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.transactionsService.update(id, updateTransactionDto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.transactionsService.remove(id, user.id);
  }
}
