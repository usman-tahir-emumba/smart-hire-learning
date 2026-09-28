import { Repository } from 'typeorm';
import { AppDataSource } from '../../db/data-source';
import { Job } from './job.entity';
import { JobStatus } from './job.enums';
import { JobCreateDto, JobUpdateDto } from './job.dto';
import { ConflictStateError, NotFoundError } from '../../common/errors';
import { normalizeSkills } from '../../common/normalize';
import { Paginated, Pagination } from '../../common/pagination';

export interface JobFilters {
  status?: JobStatus;
  skill?: string;
  title?: string;
}

export class JobService {
  private readonly repo: Repository<Job>;

  constructor(repo: Repository<Job> = AppDataSource.getRepository(Job)) {
    this.repo = repo;
  }

  async create(dto: JobCreateDto): Promise<Job> {
    const job = this.repo.create({
      title: dto.title,
      description: dto.description,
      employmentType: dto.employmentType,
      requiredSkills: normalizeSkills(dto.requiredSkills),
      minExperience: dto.minExperience ?? 0,
      maxApplications: dto.maxApplications ?? null,
      status: JobStatus.DRAFT,
      publishedAt: null,
    });
    return this.repo.save(job);
  }

  async list(filters: JobFilters, page: Pagination): Promise<Paginated<Job>> {
    const qb = this.repo.createQueryBuilder('job');

    if (filters.status) {
      qb.andWhere('job.status = :status', { status: filters.status });
    }
    if (filters.skill) {
      qb.andWhere('job.required_skills @> ARRAY[:skill]::text[]', {
        skill: filters.skill.trim().toLowerCase(),
      });
    }
    if (filters.title) {
      qb.andWhere('job.title ILIKE :title', { title: `%${filters.title}%` });
    }

    qb.orderBy('job.created_at', 'DESC').skip(page.offset).take(page.limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, limit: page.limit, offset: page.offset };
  }

  async getById(id: string): Promise<Job> {
    const job = await this.repo.findOne({ where: { id } });
    if (!job) throw new NotFoundError(`Job ${id} not found`);
    return job;
  }

  async update(id: string, dto: JobUpdateDto): Promise<Job> {
    const job = await this.getById(id);
    if (job.status === JobStatus.CLOSED) {
      throw new ConflictStateError('A closed job cannot be modified');
    }

    if (dto.title !== undefined) job.title = dto.title;
    if (dto.description !== undefined) job.description = dto.description;
    if (dto.employmentType !== undefined) job.employmentType = dto.employmentType;
    if (dto.requiredSkills !== undefined) {
      job.requiredSkills = normalizeSkills(dto.requiredSkills);
    }
    if (dto.minExperience !== undefined) job.minExperience = dto.minExperience;
    if (dto.maxApplications !== undefined) job.maxApplications = dto.maxApplications;

    return this.repo.save(job);
  }

  async publish(id: string): Promise<Job> {
    const job = await this.getById(id);
    if (job.status !== JobStatus.DRAFT) {
      throw new ConflictStateError(
        `Only a draft job can be published (current status: ${job.status})`,
      );
    }
    job.status = JobStatus.PUBLISHED;
    job.publishedAt = new Date();
    return this.repo.save(job);
  }

  async close(id: string): Promise<Job> {
    const job = await this.getById(id);
    if (job.status === JobStatus.CLOSED) {
      throw new ConflictStateError('Job is already closed');
    }
    job.status = JobStatus.CLOSED;
    return this.repo.save(job);
  }

  async reopen(id: string): Promise<Job> {
    const job = await this.getById(id);
    if (job.status !== JobStatus.CLOSED) {
      throw new ConflictStateError(
        `Only a closed job can be reopened (current status: ${job.status})`,
      );
    }
    job.status = JobStatus.DRAFT;
    job.publishedAt = null;
    return this.repo.save(job);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo.delete({ id });
    if (!result.affected) throw new NotFoundError(`Job ${id} not found`);
  }
}
