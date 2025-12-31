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
import { InvestmentsService } from './investments.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('investments')
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createInvestmentDto: CreateInvestmentDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.investmentsService.create(createInvestmentDto, user.id);
  }

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.investmentsService.findAll(user.id);
  }

  @Get('portfolio')
  getPortfolio(@CurrentUser() user: { id: string }) {
    return this.investmentsService.getPortfolio(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.investmentsService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInvestmentDto: UpdateInvestmentDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.investmentsService.update(id, updateInvestmentDto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.investmentsService.remove(id, user.id);
  }
}

