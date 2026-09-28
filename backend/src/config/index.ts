function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer, got "${raw}"`);
  }
  return parsed;
}

export interface Config {
  env: string;
  port: number;
  logLevel: string;
  maxPageSize: number;
  db: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
  };
}

export const config: Config = {
  env: process.env.NODE_ENV ?? 'development',
  port: optionalInt('PORT', 8000),
  logLevel: process.env.LOG_LEVEL ?? 'info',
  maxPageSize: optionalInt('MAX_PAGE_SIZE', 100),
  db: {
    host: required('DB_HOST'),
    port: optionalInt('DB_PORT', 5432),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    name: required('DB_NAME'),
  },
};
