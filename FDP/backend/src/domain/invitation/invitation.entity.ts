import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Group } from '../group/group.entity';

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  inviteCode!: string;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @ManyToOne(() => Group, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  group!: Group;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column()
  createdById!: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt?: Date;
}
