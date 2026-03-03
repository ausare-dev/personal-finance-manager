import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

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

  async create(dto: CreateArticleDto): Promise<Article> {
    const article = this.articleRepository.create({
      title: dto.title,
      content: dto.content,
      category: dto.category,
      ...(dto.summary != null && dto.summary !== ''
        ? { summary: dto.summary }
        : {}),
    });
    return this.articleRepository.save(article);
  }

  async update(id: string, dto: UpdateArticleDto): Promise<Article> {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }
    if (dto.title !== undefined) article.title = dto.title;
    if (dto.content !== undefined) article.content = dto.content;
    if (dto.category !== undefined) article.category = dto.category;
    if (dto.summary !== undefined) article.summary = dto.summary;
    return this.articleRepository.save(article);
  }

  async remove(id: string): Promise<void> {
    const result = await this.articleRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }
  }
}
