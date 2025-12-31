import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createBudgetDto: CreateBudgetDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.budgetsService.create(createBudgetDto, user.id);
  }

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.budgetsService.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.budgetsService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.budgetsService.update(id, updateBudgetDto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.budgetsService.remove(id, user.id);
  }
}

