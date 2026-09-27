import { plainToInstance } from 'class-transformer';
import { validate, ValidationError as CVError } from 'class-validator';
import { ValidationError } from './errors';

export async function validateDto<T extends object>(
  cls: new () => T,
  payload: unknown,
): Promise<T> {
  const instance = plainToInstance(cls, payload ?? {}, {
    enableImplicitConversion: false,
  });

  const errors = await validate(instance as object, {
    whitelist: true,
    forbidNonWhitelisted: false,
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new ValidationError('Request validation failed', flatten(errors));
  }
  return instance;
}

function flatten(errors: CVError[], parent = ''): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const err of errors) {
    const path = parent ? `${parent}.${err.property}` : err.property;
    if (err.constraints) {
      out[path] = Object.values(err.constraints);
    }
    if (err.children && err.children.length > 0) {
      Object.assign(out, flatten(err.children, path));
    }
  }
  return out;
}
