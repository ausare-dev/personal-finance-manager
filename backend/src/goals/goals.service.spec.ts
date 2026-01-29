import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoalsService } from './goals.service';
import { Goal } from '../entities/goal.entity';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

describe('GoalsService', () => {
  let service: GoalsService;
  let repository: Repository<Goal>;

  const futureDate = new Date(Date.now() + 86400000 * 30); // 30 days ahead

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsService,
        {
          provide: getRepositoryToken(Goal),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<GoalsService>(GoalsService);
    repository = module.get<Repository<Goal>>(getRepositoryToken(Goal));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return goals with progress for user', async () => {
      const userId = 'user-123';
      const mockGoals: Goal[] = [
        {
          id: 'goal-1',
          userId,
          name: 'Vacation',
          targetAmount: 100000,
          currentAmount: 25000,
          deadline: futureDate,
          interestRate: 0,
          createdAt: new Date(),
        } as Goal,
      ];

      mockRepository.find.mockResolvedValue(mockGoals);

      const result = await service.findAll(userId);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('progressPercentage');
      expect(result[0]).toHaveProperty('remainingAmount');
      expect(result[0]).toHaveProperty('daysRemaining');
      expect(result[0]).toHaveProperty('projectedAmount');
      expect(result[0]).toHaveProperty('isOnTrack');
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { deadline: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a goal if found and belongs to user', async () => {
      const goalId = 'goal-1';
      const userId = 'user-123';
      const mockGoal: Goal = {
        id: goalId,
        userId,
        name: 'Vacation',
        targetAmount: 100000,
        currentAmount: 25000,
        deadline: futureDate,
        interestRate: 0,
        createdAt: new Date(),
      } as Goal;

      mockRepository.findOne.mockResolvedValue(mockGoal);

      const result = await service.findOne(goalId, userId);

      expect(result).toBeDefined();
      expect(result.progressPercentage).toBe(25);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: goalId },
      });
    });

    it('should throw NotFoundException if goal not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if goal belongs to different user', async () => {
      const mockGoal: Goal = {
        id: 'goal-1',
        userId: 'other-user',
        name: 'Vacation',
        targetAmount: 100000,
        currentAmount: 25000,
        deadline: futureDate,
        interestRate: 0,
        createdAt: new Date(),
      } as Goal;

      mockRepository.findOne.mockResolvedValue(mockGoal);

      await expect(service.findOne('goal-1', 'user-123')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('create', () => {
    it('should create and return a new goal', async () => {
      const userId = 'user-123';
      const createGoalDto: CreateGoalDto = {
        name: 'New Car',
        targetAmount: 500000,
        deadline: futureDate.toISOString(),
        currentAmount: 0,
        interestRate: 5,
      };
      const mockGoal: Goal = {
        id: 'goal-1',
        userId,
        ...createGoalDto,
        currentAmount: 0,
        interestRate: 5,
        deadline: futureDate,
        createdAt: new Date(),
      } as Goal;

      mockRepository.create.mockReturnValue(mockGoal);
      mockRepository.save.mockResolvedValue(mockGoal);

      const result = await service.create(createGoalDto, userId);

      expect(result).toBeDefined();
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createGoalDto,
        userId,
        currentAmount: 0,
        interestRate: 5,
        deadline: futureDate,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockGoal);
    });

    it('should throw BadRequestException if deadline is in the past', async () => {
      const userId = 'user-123';
      const createGoalDto: CreateGoalDto = {
        name: 'Past Goal',
        targetAmount: 1000,
        deadline: new Date(Date.now() - 86400000).toISOString(),
      };

      await expect(service.create(createGoalDto, userId)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if currentAmount exceeds targetAmount', async () => {
      const userId = 'user-123';
      const createGoalDto: CreateGoalDto = {
        name: 'Goal',
        targetAmount: 1000,
        deadline: futureDate.toISOString(),
        currentAmount: 1500,
      };

      await expect(service.create(createGoalDto, userId)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a goal', async () => {
      const goalId = 'goal-1';
      const userId = 'user-123';
      const mockGoal: Goal = {
        id: goalId,
        userId,
        name: 'Vacation',
        targetAmount: 100000,
        currentAmount: 25000,
        deadline: futureDate,
        interestRate: 0,
        createdAt: new Date(),
      } as Goal;
      const updateGoalDto: UpdateGoalDto = { name: 'Updated Vacation' };

      mockRepository.findOne.mockResolvedValue(mockGoal);
      mockRepository.save.mockResolvedValue({
        ...mockGoal,
        ...updateGoalDto,
      });

      const result = await service.update(goalId, updateGoalDto, userId);

      expect(result).toBeDefined();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if goal not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'X' }, 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if goal belongs to different user', async () => {
      const mockGoal: Goal = {
        id: 'goal-1',
        userId: 'other-user',
        name: 'Vacation',
        targetAmount: 100000,
        currentAmount: 25000,
        deadline: futureDate,
        interestRate: 0,
        createdAt: new Date(),
      } as Goal;

      mockRepository.findOne.mockResolvedValue(mockGoal);

      await expect(
        service.update('goal-1', { name: 'X' }, 'user-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove a goal', async () => {
      const goalId = 'goal-1';
      const userId = 'user-123';
      const mockGoal: Goal = {
        id: goalId,
        userId,
        name: 'Vacation',
        targetAmount: 100000,
        currentAmount: 25000,
        deadline: futureDate,
        interestRate: 0,
        createdAt: new Date(),
      } as Goal;

      mockRepository.findOne.mockResolvedValue(mockGoal);
      mockRepository.remove.mockResolvedValue(mockGoal);

      await service.remove(goalId, userId);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockGoal);
    });

    it('should throw NotFoundException if goal not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if goal belongs to different user', async () => {
      const mockGoal: Goal = {
        id: 'goal-1',
        userId: 'other-user',
        name: 'Vacation',
        targetAmount: 100000,
        currentAmount: 25000,
        deadline: futureDate,
        interestRate: 0,
        createdAt: new Date(),
      } as Goal;

      mockRepository.findOne.mockResolvedValue(mockGoal);

      await expect(service.remove('goal-1', 'user-123')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
