import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../entities/article.entity';

@Injectable()
export class EducationService {
  constructor(
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
  ) {}

  async findAll(category?: string): Promise<Article[]> {
    const where = category ? { category } : {};
    return this.articleRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Article> {
    const article = await this.articleRepository.findOne({ where: { id } });

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    // Увеличить счетчик прочтений
    article.readCount += 1;
    await this.articleRepository.save(article);

    return article;
  }

  async findByCategory(category: string): Promise<Article[]> {
    return this.articleRepository.find({
      where: { category },
      order: { createdAt: 'DESC' },
    });
  }

  async getCategories(): Promise<string[]> {
    const articles = await this.articleRepository.find({
      select: ['category'],
    });
    const categories = [...new Set(articles.map((a) => a.category))];
    return categories.sort();
  }
}

