import { Controller, Get, Param, Query } from '@nestjs/common';
import { EducationService } from './education.service';
import { Public } from '../auth/decorators/public.decorator';

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
}

