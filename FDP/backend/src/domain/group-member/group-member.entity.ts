import {
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  Column,
} from 'typeorm';
import { Group } from '../group/group.entity';
import { Member } from '../member/member.entity';

@Entity('group_members')
export class GroupMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Group)
  group!: Group;

  @ManyToOne(() => Member)
  member!: Member;

  @Column({
    type: 'enum',
    enum: ['ADMIN', 'MEMBER', 'GUEST'],
    default: 'GUEST',
  })
  role!: string;

  @CreateDateColumn({ type: 'timestamp' })
  joinedAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt?: Date;
}
