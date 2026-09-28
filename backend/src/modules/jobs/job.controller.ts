import { Request, Response } from 'express';
import { JobService, JobFilters } from './job.service';
import { JobCreateDto, JobUpdateDto, toJobRead } from './job.dto';
import { validateDto } from '../../common/validation';
import { parsePagination } from '../../common/pagination';
import { JobStatus } from './job.enums';

export class JobController {
  constructor(private readonly service: JobService = new JobService()) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const dto = await validateDto(JobCreateDto, req.body);
    const job = await this.service.create(dto);
    res.status(201).json(toJobRead(job));
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const filters: JobFilters = {
      status: parseStatus(req.query.status),
      skill: asString(req.query.skill),
      title: asString(req.query.title),
    };
    const page = parsePagination(req.query as Record<string, unknown>);
    const result = await this.service.list(filters, page);
    res.json({
      items: result.items.map(toJobRead),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const job = await this.service.getById(req.params.id);
    res.json(toJobRead(job));
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const dto = await validateDto(JobUpdateDto, req.body);
    const job = await this.service.update(req.params.id, dto);
    res.json(toJobRead(job));
  };

  publish = async (req: Request, res: Response): Promise<void> => {
    const job = await this.service.publish(req.params.id);
    res.json(toJobRead(job));
  };

  close = async (req: Request, res: Response): Promise<void> => {
    const job = await this.service.close(req.params.id);
    res.json(toJobRead(job));
  };

  reopen = async (req: Request, res: Response): Promise<void> => {
    const job = await this.service.reopen(req.params.id);
    res.json(toJobRead(job));
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    await this.service.remove(req.params.id);
    res.status(204).send();
  };
}

function parseStatus(value: unknown): JobStatus | undefined {
  if (typeof value !== 'string') return undefined;
  return (Object.values(JobStatus) as string[]).includes(value)
    ? (value as JobStatus)
    : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}
