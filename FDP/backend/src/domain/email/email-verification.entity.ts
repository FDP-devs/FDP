import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export enum VerificationType {
  SIGNUP = 'SIGNUP',
  PW_RESET = 'PW_RESET',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  FAILED = 'FAILED', // 이메일 전송 실패 등
}

@Entity('email_verifications')
export class EmailVerification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  email!: string;

  @Column({ type: 'varchar' })
  verificationCode!: string;

  @Column({
    type: 'enum',
    enum: VerificationType,
  })
  type!: VerificationType;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  status!: VerificationStatus;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt?: Date;
}
