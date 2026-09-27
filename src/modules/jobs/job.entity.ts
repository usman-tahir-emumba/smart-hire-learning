import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EmploymentType, JobStatus } from './job.enums';

@Entity({ name: 'jobs' })
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Index()
  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.DRAFT })
  status!: JobStatus;

  @Column({ name: 'employment_type', type: 'enum', enum: EmploymentType })
  employmentType!: EmploymentType;

  @Index('idx_jobs_required_skills', { synchronize: false })
  @Column({ name: 'required_skills', type: 'text', array: true, default: () => "'{}'" })
  requiredSkills!: string[];

  @Column({ name: 'min_experience', type: 'int', default: 0 })
  minExperience!: number;

  @Column({ name: 'max_applications', type: 'int', nullable: true })
  maxApplications!: number | null;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
