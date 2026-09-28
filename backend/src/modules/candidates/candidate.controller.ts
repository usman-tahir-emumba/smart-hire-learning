import { Request, Response } from 'express';
import { CandidateService, CandidateFilters } from './candidate.service';
import { CandidateCreateDto, CandidateUpdateDto, toCandidateRead } from './candidate.dto';
import { validateDto } from '../../common/validation';
import { parsePagination } from '../../common/pagination';

export class CandidateController {
  constructor(private readonly service: CandidateService = new CandidateService()) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const dto = await validateDto(CandidateCreateDto, req.body);
    const candidate = await this.service.create(dto);
    res.status(201).json(toCandidateRead(candidate));
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const filters: CandidateFilters = {
      skill: asString(req.query.skill),
      name: asString(req.query.name),
      minExperience: asInt(req.query.minExperience),
    };
    const page = parsePagination(req.query as Record<string, unknown>);
    const result = await this.service.list(filters, page);
    res.json({
      items: result.items.map(toCandidateRead),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const candidate = await this.service.getById(req.params.id);
    res.json(toCandidateRead(candidate));
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const dto = await validateDto(CandidateUpdateDto, req.body);
    const candidate = await this.service.update(req.params.id, dto);
    res.json(toCandidateRead(candidate));
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    await this.service.remove(req.params.id);
    res.status(204).send();
  };
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function asInt(value: unknown): number | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
}
