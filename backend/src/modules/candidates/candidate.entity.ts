import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'candidates' })
export class Candidate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('uq_candidates_email', { unique: true })
  @Column({ type: 'text' })
  email!: string;

  @Column({ name: 'full_name', type: 'text' })
  fullName!: string;

  @Column({ type: 'text', nullable: true })
  phone!: string | null;

  @Column({ type: 'text', nullable: true })
  headline!: string | null;

  @Index()
  @Column({ name: 'experience_years', type: 'int', default: 0 })
  experienceYears!: number;

  @Index('idx_candidates_skills', { synchronize: false })
  @Column({ type: 'text', array: true, default: () => "'{}'" })
  skills!: string[];

  @Column({ name: 'resume_url', type: 'text', nullable: true })
  resumeUrl!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
