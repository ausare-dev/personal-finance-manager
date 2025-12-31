import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('investments')
export class Investment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  assetName: string;

  @Column('decimal', { precision: 15, scale: 2 })
  quantity: number;

  @Column('decimal', { precision: 15, scale: 2 })
  purchasePrice: number;

  @Column('decimal', { precision: 15, scale: 2 })
  currentPrice: number;

  @Column('timestamp')
  purchaseDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.investments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}

