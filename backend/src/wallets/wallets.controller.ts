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
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createWalletDto: CreateWalletDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.walletsService.create(createWalletDto, user.id);
  }

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.walletsService.findAll(user.id);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.walletsService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWalletDto: UpdateWalletDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.walletsService.update(id, updateWalletDto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.walletsService.remove(id, user.id);
  }
}
