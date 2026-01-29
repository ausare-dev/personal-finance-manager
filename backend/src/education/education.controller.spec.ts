import { Test, TestingModule } from '@nestjs/testing';
import { EducationController } from './education.controller';
import { EducationService } from './education.service';

describe('EducationController', () => {
  let controller: EducationController;
  let service: EducationService;

  const mockEducationService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    getCategories: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EducationController],
      providers: [
        {
          provide: EducationService,
          useValue: mockEducationService,
        },
      ],
    }).compile();

    controller = module.get<EducationController>(EducationController);
    service = module.get<EducationService>(EducationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return articles without category filter', async () => {
      const mockArticles = [
        { id: 'art-1', title: 'Budgeting', category: 'Basics' },
      ];
      mockEducationService.findAll.mockResolvedValue(mockArticles);

      const result = await controller.findAll(undefined);

      expect(result).toEqual(mockArticles);
      expect(service.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should return articles filtered by category', async () => {
      const mockArticles = [];
      mockEducationService.findAll.mockResolvedValue(mockArticles);

      const result = await controller.findAll('Basics');

      expect(result).toEqual(mockArticles);
      expect(service.findAll).toHaveBeenCalledWith('Basics');
    });
  });

  describe('findOne', () => {
    it('should return article by id', async () => {
      const articleId = 'art-1';
      const mockArticle = {
        id: articleId,
        title: 'Budgeting',
        content: 'Content',
        readCount: 1,
      };
      mockEducationService.findOne.mockResolvedValue(mockArticle);

      const result = await controller.findOne(articleId);

      expect(result).toEqual(mockArticle);
      expect(service.findOne).toHaveBeenCalledWith(articleId);
    });
  });

  describe('getCategories', () => {
    it('should return categories', async () => {
      const mockCategories = ['Basics', 'Investing'];
      mockEducationService.getCategories.mockResolvedValue(mockCategories);

      const result = await controller.getCategories();

      expect(result).toEqual(mockCategories);
      expect(service.getCategories).toHaveBeenCalled();
    });
  });
});
