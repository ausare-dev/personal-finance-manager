import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EducationService } from './education.service';
import { Article } from '../entities/article.entity';
import { NotFoundException } from '@nestjs/common';

describe('EducationService', () => {
  let service: EducationService;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EducationService,
        {
          provide: getRepositoryToken(Article),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<EducationService>(EducationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all articles when no category', async () => {
      const mockArticles: Article[] = [
        {
          id: 'art-1',
          title: 'Budgeting',
          content: 'Content',
          category: 'Basics',
          readCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Article,
      ];

      mockRepository.find.mockResolvedValue(mockArticles);

      const result = await service.findAll();

      expect(result).toEqual(mockArticles);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {},
        order: { createdAt: 'DESC' },
      });
    });

    it('should return articles filtered by category', async () => {
      const mockArticles: Article[] = [];
      mockRepository.find.mockResolvedValue(mockArticles);

      await service.findAll('Basics');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { category: 'Basics' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return article and increment readCount', async () => {
      const articleId = 'art-1';
      const mockArticle: Article = {
        id: articleId,
        title: 'Budgeting',
        content: 'Content',
        category: 'Basics',
        readCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Article;

      mockRepository.findOne.mockResolvedValue({ ...mockArticle });
      mockRepository.save.mockImplementation((a: Article) =>
        Promise.resolve({ ...a, readCount: a.readCount }),
      );

      const result = await service.findOne(articleId);

      expect(result).toBeDefined();
      expect(result.readCount).toBe(6);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: articleId },
      });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if article not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findByCategory', () => {
    it('should return articles by category', async () => {
      const mockArticles: Article[] = [];
      mockRepository.find.mockResolvedValue(mockArticles);

      const result = await service.findByCategory('Basics');

      expect(result).toEqual(mockArticles);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { category: 'Basics' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getCategories', () => {
    it('should return sorted unique categories', async () => {
      const mockArticles: Partial<Article>[] = [
        { category: 'Investing' },
        { category: 'Basics' },
        { category: 'Basics' },
      ];

      mockRepository.find.mockResolvedValue(mockArticles);

      const result = await service.getCategories();

      expect(result).toEqual(['Basics', 'Investing']);
      expect(mockRepository.find).toHaveBeenCalledWith({
        select: ['category'],
      });
    });
  });
});
