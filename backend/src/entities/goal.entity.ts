import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  name: string;

  @Column('decimal', { precision: 15, scale: 2 })
  targetAmount: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  currentAmount: number;

  @Column('timestamp')
  deadline: Date;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  interestRate: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.goals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}

