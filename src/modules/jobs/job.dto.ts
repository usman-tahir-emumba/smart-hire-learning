import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { EmploymentType, JobStatus } from './job.enums';
import { Job } from './job.entity';

export class JobCreateDto {
  @IsString()
  @Length(1, 200)
  title!: string;

  @IsString()
  @Length(1, 20000)
  description!: string;

  @IsEnum(EmploymentType)
  employmentType!: EmploymentType;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  requiredSkills?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  minExperience?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxApplications?: number;
}

export class JobUpdateDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20000)
  description?: string;

  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  requiredSkills?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  minExperience?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxApplications?: number | null;
}

export interface JobReadDto {
  id: string;
  title: string;
  description: string;
  status: JobStatus;
  employmentType: EmploymentType;
  requiredSkills: string[];
  minExperience: number;
  maxApplications: number | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toJobRead(job: Job): JobReadDto {
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    status: job.status,
    employmentType: job.employmentType,
    requiredSkills: job.requiredSkills,
    minExperience: job.minExperience,
    maxApplications: job.maxApplications,
    publishedAt: job.publishedAt ? job.publishedAt.toISOString() : null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}
