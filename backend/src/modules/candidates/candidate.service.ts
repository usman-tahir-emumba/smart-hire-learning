import { Repository } from 'typeorm';
import { AppDataSource } from '../../db/data-source';
import { Candidate } from './candidate.entity';
import { CandidateCreateDto, CandidateUpdateDto } from './candidate.dto';
import { ConflictError, NotFoundError } from '../../common/errors';
import { normalizeEmail, normalizeSkills } from '../../common/normalize';
import { Paginated, Pagination } from '../../common/pagination';

export interface CandidateFilters {
  skill?: string;
  name?: string;
  minExperience?: number;
}

export class CandidateService {
  private readonly repo: Repository<Candidate>;

  constructor(repo: Repository<Candidate> = AppDataSource.getRepository(Candidate)) {
    this.repo = repo;
  }

  async create(dto: CandidateCreateDto): Promise<Candidate> {
    const email = normalizeEmail(dto.email);

    const existing = await this.repo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictError('A candidate with this email already exists');
    }

    const candidate = this.repo.create({
      email,
      fullName: dto.fullName,
      phone: dto.phone ?? null,
      headline: dto.headline ?? null,
      experienceYears: dto.experienceYears ?? 0,
      skills: normalizeSkills(dto.skills),
      resumeUrl: dto.resumeUrl ?? null,
    });
    return this.repo.save(candidate);
  }

  async list(filters: CandidateFilters, page: Pagination): Promise<Paginated<Candidate>> {
    const qb = this.repo.createQueryBuilder('candidate');

    if (filters.skill) {
      qb.andWhere('candidate.skills @> ARRAY[:skill]::text[]', {
        skill: filters.skill.trim().toLowerCase(),
      });
    }
    if (filters.name) {
      qb.andWhere('candidate.full_name ILIKE :name', { name: `%${filters.name}%` });
    }
    if (filters.minExperience !== undefined) {
      qb.andWhere('candidate.experience_years >= :minExp', {
        minExp: filters.minExperience,
      });
    }

    qb.orderBy('candidate.created_at', 'DESC').skip(page.offset).take(page.limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, limit: page.limit, offset: page.offset };
  }

  async getById(id: string): Promise<Candidate> {
    const candidate = await this.repo.findOne({ where: { id } });
    if (!candidate) throw new NotFoundError(`Candidate ${id} not found`);
    return candidate;
  }

  async update(id: string, dto: CandidateUpdateDto): Promise<Candidate> {
    const candidate = await this.getById(id);

    if (dto.fullName !== undefined) candidate.fullName = dto.fullName;
    if (dto.phone !== undefined) candidate.phone = dto.phone;
    if (dto.headline !== undefined) candidate.headline = dto.headline;
    if (dto.experienceYears !== undefined) candidate.experienceYears = dto.experienceYears;
    if (dto.skills !== undefined) candidate.skills = normalizeSkills(dto.skills);
    if (dto.resumeUrl !== undefined) candidate.resumeUrl = dto.resumeUrl;

    return this.repo.save(candidate);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo.delete({ id });
    if (!result.affected) throw new NotFoundError(`Candidate ${id} not found`);
  }
}
