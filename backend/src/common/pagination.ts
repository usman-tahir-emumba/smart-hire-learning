import { config } from '../config';

export interface Pagination {
  limit: number;
  offset: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export function parsePagination(query: Record<string, unknown>): Pagination {
  const limit = clampInt(query.limit, 20, 1, config.maxPageSize);
  const offset = clampInt(query.offset, 0, 0, Number.MAX_SAFE_INTEGER);
  return { limit, offset };
}

function clampInt(raw: unknown, fallback: number, min: number, max: number): number {
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  const int = Math.trunc(parsed);
  if (int < min) return min;
  if (int > max) return max;
  return int;
}
