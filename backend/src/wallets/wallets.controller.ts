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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Wallets')
@ApiBearerAuth('JWT-auth')
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создать новый кошелек' })
  @ApiResponse({ status: 201, description: 'Кошелек успешно создан' })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  create(
    @Body() createWalletDto: CreateWalletDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.walletsService.create(createWalletDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все кошельки пользователя' })
  @ApiResponse({ status: 200, description: 'Список кошельков' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  findAll(@CurrentUser() user: { id: string }) {
    return this.walletsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить кошелек по ID' })
  @ApiParam({ name: 'id', description: 'ID кошелька' })
  @ApiResponse({ status: 200, description: 'Информация о кошельке' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Нет доступа к кошельку' })
  @ApiResponse({ status: 404, description: 'Кошелек не найден' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.walletsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить кошелек' })
  @ApiParam({ name: 'id', description: 'ID кошелька' })
  @ApiResponse({ status: 200, description: 'Кошелек успешно обновлен' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Нет доступа к кошельку' })
  @ApiResponse({ status: 404, description: 'Кошелек не найден' })
  update(
    @Param('id') id: string,
    @Body() updateWalletDto: UpdateWalletDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.walletsService.update(id, updateWalletDto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить кошелек' })
  @ApiParam({ name: 'id', description: 'ID кошелька' })
  @ApiResponse({ status: 204, description: 'Кошелек успешно удален' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Нет доступа к кошельку' })
  @ApiResponse({ status: 404, description: 'Кошелек не найден' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.walletsService.remove(id, user.id);
  }
}
