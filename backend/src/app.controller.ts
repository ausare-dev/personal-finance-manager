import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AppService } from './app.service';
import { UserService } from './user/user.service';
import { Public } from './auth/decorators/public.decorator';
import { CurrentUser } from './auth/decorators/current-user.decorator';
import { UpdateEmailDto } from './app/dto/update-email.dto';
import { UpdatePasswordDto } from './app/dto/update-password.dto';

@ApiTags('Profile')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly userService: UserService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Проверка работы API' })
  @ApiResponse({ status: 200, description: 'API работает' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('profile')
  @ApiOperation({ summary: 'Получить профиль пользователя' })
  @ApiResponse({ status: 200, description: 'Профиль пользователя' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getProfile(
    @CurrentUser() user: { id: string; email: string; role?: string },
  ) {
    const userData = await this.userService.findById(user.id);
    if (!userData) {
      return {
        message: 'User not found',
        user: null,
      };
    }

    return {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    };
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Обновить email пользователя' })
  @ApiBody({ type: UpdateEmailDto })
  @ApiResponse({ status: 200, description: 'Email успешно обновлен' })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  @ApiResponse({ status: 409, description: 'Email уже используется' })
  async updateEmail(
    @CurrentUser() user: { id: string; email: string; role?: string },
    @Body() updateEmailDto: UpdateEmailDto,
  ) {
    const updatedUser = await this.userService.updateEmail(
      user.id,
      updateEmailDto.email,
    );
    return {
      message: 'Email успешно обновлен',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    };
  }

  @Patch('profile/password')
  @ApiOperation({ summary: 'Изменить пароль' })
  @ApiBody({ type: UpdatePasswordDto })
  @ApiResponse({ status: 200, description: 'Пароль успешно изменен' })
  @ApiResponse({ status: 400, description: 'Неверный текущий пароль' })
  async updatePassword(
    @CurrentUser() user: { id: string; email: string; role?: string },
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    await this.userService.updatePassword(
      user.id,
      updatePasswordDto.currentPassword,
      updatePasswordDto.newPassword,
    );
    return {
      message: 'Пароль успешно изменен',
    };
  }
}
