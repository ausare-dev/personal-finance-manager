import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Patch,
  Delete,
  Body,
  UseGuards,
} from '@nestjs/common';
import { EducationService } from './education.service';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Controller('education')
export class EducationController {
  constructor(private readonly educationService: EducationService) {}

  @Public()
  @Get('articles')
  findAll(@Query('category') category?: string) {
    return this.educationService.findAll(category);
  }

  @Public()
  @Get('articles/:id')
  findOne(@Param('id') id: string) {
    return this.educationService.findOne(id);
  }

  @Public()
  @Get('categories')
  getCategories() {
    return this.educationService.getCategories();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('articles')
  create(@Body() dto: CreateArticleDto) {
    return this.educationService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('articles/:id')
  update(@Param('id') id: string, @Body() dto: UpdateArticleDto) {
    return this.educationService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('articles/:id')
  async remove(@Param('id') id: string) {
    await this.educationService.remove(id);
  }
}
