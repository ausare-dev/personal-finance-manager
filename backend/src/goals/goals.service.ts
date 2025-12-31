import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal } from '../entities/goal.entity';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

export interface GoalWithProgress extends Goal {
  progressPercentage: number;
  remainingAmount: number;
  daysRemaining: number;
  projectedAmount: number; // С учетом процентной ставки
  projectedProgress: number; // Прогресс с учетом процентов
  isOnTrack: boolean; // Достижима ли цель с учетом процентов
}

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(Goal)
    private goalRepository: Repository<Goal>,
  ) {}

  async findAll(userId: string): Promise<GoalWithProgress[]> {
    const goals = await this.goalRepository.find({
      where: { userId },
      order: { deadline: 'ASC' },
    });

    return goals.map((goal) => this.calculateProgress(goal));
  }

  async findOne(id: string, userId: string): Promise<GoalWithProgress> {
    const goal = await this.goalRepository.findOne({ where: { id } });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${id} not found`);
    }

    if (goal.userId !== userId) {
      throw new ForbiddenException('You do not have access to this goal');
    }

    return this.calculateProgress(goal);
  }

  async create(
    createGoalDto: CreateGoalDto,
    userId: string,
  ): Promise<GoalWithProgress> {
    const deadline = new Date(createGoalDto.deadline);
    const now = new Date();

    if (deadline <= now) {
      throw new BadRequestException('Deadline must be in the future');
    }

    if (
      createGoalDto.currentAmount !== undefined &&
      createGoalDto.currentAmount > createGoalDto.targetAmount
    ) {
      throw new BadRequestException(
        'Current amount cannot exceed target amount',
      );
    }

    const goal = this.goalRepository.create({
      ...createGoalDto,
      userId,
      currentAmount: createGoalDto.currentAmount ?? 0,
      interestRate: createGoalDto.interestRate ?? 0,
      deadline,
    });

    const savedGoal = await this.goalRepository.save(goal);
    return this.calculateProgress(savedGoal);
  }

  async update(
    id: string,
    updateGoalDto: UpdateGoalDto,
    userId: string,
  ): Promise<GoalWithProgress> {
    const goal = await this.goalRepository.findOne({ where: { id } });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${id} not found`);
    }

    if (goal.userId !== userId) {
      throw new ForbiddenException('You do not have access to this goal');
    }

    // Validate deadline if provided
    if (updateGoalDto.deadline) {
      const deadline = new Date(updateGoalDto.deadline);
      const now = new Date();

      if (deadline <= now) {
        throw new BadRequestException('Deadline must be in the future');
      }
    }

    // Validate currentAmount
    const targetAmount = updateGoalDto.targetAmount
      ? parseFloat(updateGoalDto.targetAmount.toString())
      : parseFloat(goal.targetAmount.toString());
    const currentAmount = updateGoalDto.currentAmount
      ? parseFloat(updateGoalDto.currentAmount.toString())
      : parseFloat(goal.currentAmount.toString());

    if (currentAmount > targetAmount) {
      throw new BadRequestException(
        'Current amount cannot exceed target amount',
      );
    }

    // Update fields
    Object.assign(goal, {
      ...updateGoalDto,
      deadline: updateGoalDto.deadline
        ? new Date(updateGoalDto.deadline)
        : goal.deadline,
    });

    const updatedGoal = await this.goalRepository.save(goal);
    return this.calculateProgress(updatedGoal);
  }

  async remove(id: string, userId: string): Promise<void> {
    const goal = await this.goalRepository.findOne({ where: { id } });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${id} not found`);
    }

    if (goal.userId !== userId) {
      throw new ForbiddenException('You do not have access to this goal');
    }

    await this.goalRepository.remove(goal);
  }

  private calculateProgress(goal: Goal): GoalWithProgress {
    const numericCurrentAmount = parseFloat(
      goal.currentAmount.toString(),
    );
    const numericTargetAmount = parseFloat(goal.targetAmount.toString());
    const numericInterestRate = parseFloat(goal.interestRate.toString());

    // Calculate progress percentage
    const progressPercentage =
      numericTargetAmount > 0
        ? Math.min(100, (numericCurrentAmount / numericTargetAmount) * 100)
        : 0;

    // Calculate remaining amount
    const remainingAmount = Math.max(
      0,
      numericTargetAmount - numericCurrentAmount,
    );

    // Calculate days remaining
    const now = new Date();
    const deadline = new Date(goal.deadline);
    const diffTime = deadline.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Calculate projected amount with interest
    let projectedAmount = numericCurrentAmount;
    if (numericInterestRate > 0 && daysRemaining > 0) {
      // Calculate years remaining
      const yearsRemaining = daysRemaining / 365.25;

      // Simple compound interest calculation
      // A = P * (1 + r)^t
      projectedAmount =
        numericCurrentAmount * Math.pow(1 + numericInterestRate / 100, yearsRemaining);
    }

    // Calculate projected progress
    const projectedProgress =
      numericTargetAmount > 0
        ? Math.min(100, (projectedAmount / numericTargetAmount) * 100)
        : 0;

    // Check if goal is on track (projected amount >= target amount)
    const isOnTrack = projectedAmount >= numericTargetAmount;

    return {
      ...goal,
      progressPercentage: Math.round(progressPercentage * 100) / 100,
      remainingAmount: Math.round(remainingAmount * 100) / 100,
      daysRemaining,
      projectedAmount: Math.round(projectedAmount * 100) / 100,
      projectedProgress: Math.round(projectedProgress * 100) / 100,
      isOnTrack,
    };
  }
}

