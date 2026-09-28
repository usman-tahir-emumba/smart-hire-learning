import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Min,
} from 'class-validator';
import { Candidate } from './candidate.entity';

export class CandidateCreateDto {
  @IsEmail()
  @Length(3, 254)
  email!: string;

  @IsString()
  @Length(1, 200)
  fullName!: string;

  @IsOptional()
  @IsString()
  @Length(1, 40)
  phone?: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  headline?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  experienceYears?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsUrl()
  @Length(1, 2048)
  resumeUrl?: string;
}

export class CandidateUpdateDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  fullName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 40)
  phone?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  headline?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  experienceYears?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsUrl()
  @Length(1, 2048)
  resumeUrl?: string | null;
}

export interface CandidateReadDto {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  headline: string | null;
  experienceYears: number;
  skills: string[];
  resumeUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toCandidateRead(candidate: Candidate): CandidateReadDto {
  return {
    id: candidate.id,
    email: candidate.email,
    fullName: candidate.fullName,
    phone: candidate.phone,
    headline: candidate.headline,
    experienceYears: candidate.experienceYears,
    skills: candidate.skills,
    resumeUrl: candidate.resumeUrl,
    createdAt: candidate.createdAt.toISOString(),
    updatedAt: candidate.updatedAt.toISOString(),
  };
}
