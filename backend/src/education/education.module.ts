import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from '../entities/article.entity';
import { EducationService } from './education.service';
import { EducationController } from './education.controller';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Article])],
  controllers: [EducationController],
  providers: [EducationService, RolesGuard],
  exports: [EducationService],
})
export class EducationModule {}
