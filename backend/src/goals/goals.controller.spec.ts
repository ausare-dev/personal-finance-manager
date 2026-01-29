import { Test, TestingModule } from '@nestjs/testing';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

describe('GoalsController', () => {
  let controller: GoalsController;
  let service: GoalsService;

  const futureDate = new Date(Date.now() + 86400000 * 30).toISOString();

  const mockGoalsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoalsController],
      providers: [
        {
          provide: GoalsService,
          useValue: mockGoalsService,
        },
      ],
    }).compile();

    controller = module.get<GoalsController>(GoalsController);
    service = module.get<GoalsService>(GoalsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of goals', async () => {
      const userId = 'user-123';
      const mockGoals = [
        {
          id: 'goal-1',
          userId,
          name: 'Vacation',
          targetAmount: 100000,
          currentAmount: 25000,
          progressPercentage: 25,
        },
      ];

      mockGoalsService.findAll.mockResolvedValue(mockGoals);

      const user = { id: userId };
      const result = await controller.findAll(user);

      expect(result).toEqual(mockGoals);
      expect(service.findAll).toHaveBeenCalledWith(userId);
    });
  });

  describe('findOne', () => {
    it('should return a goal by id', async () => {
      const goalId = 'goal-1';
      const userId = 'user-123';
      const mockGoal = {
        id: goalId,
        userId,
        name: 'Vacation',
        targetAmount: 100000,
      };

      mockGoalsService.findOne.mockResolvedValue(mockGoal);

      const user = { id: userId };
      const result = await controller.findOne(goalId, user);

      expect(result).toEqual(mockGoal);
      expect(service.findOne).toHaveBeenCalledWith(goalId, userId);
    });
  });

  describe('create', () => {
    it('should create a new goal', async () => {
      const userId = 'user-123';
      const createGoalDto: CreateGoalDto = {
        name: 'New Car',
        targetAmount: 500000,
        deadline: futureDate,
      };
      const mockGoal = {
        id: 'goal-1',
        userId,
        ...createGoalDto,
      };

      mockGoalsService.create.mockResolvedValue(mockGoal);

      const user = { id: userId };
      const result = await controller.create(createGoalDto, user);

      expect(result).toEqual(mockGoal);
      expect(service.create).toHaveBeenCalledWith(createGoalDto, userId);
    });
  });

  describe('update', () => {
    it('should update a goal', async () => {
      const goalId = 'goal-1';
      const userId = 'user-123';
      const updateGoalDto: UpdateGoalDto = { name: 'Updated Goal' };
      const mockGoal = { id: goalId, userId, name: 'Updated Goal' };

      mockGoalsService.update.mockResolvedValue(mockGoal);

      const user = { id: userId };
      const result = await controller.update(goalId, updateGoalDto, user);

      expect(result).toEqual(mockGoal);
      expect(service.update).toHaveBeenCalledWith(
        goalId,
        updateGoalDto,
        userId,
      );
    });
  });

  describe('remove', () => {
    it('should remove a goal', async () => {
      const goalId = 'goal-1';
      const userId = 'user-123';

      mockGoalsService.remove.mockResolvedValue(undefined);

      const user = { id: userId };
      await controller.remove(goalId, user);

      expect(service.remove).toHaveBeenCalledWith(goalId, userId);
    });
  });
});
