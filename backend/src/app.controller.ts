import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';
import { CurrentUser } from './auth/decorators/current-user.decorator';

@ApiTags('Root')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Проверка работы API' })
  @ApiResponse({ status: 200, description: 'API работает' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('profile')
  getProfile(@CurrentUser() user: { id: string; email: string }) {
    return {
      message: 'This is a protected route',
      user,
    };
  }
}
