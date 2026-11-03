import type { RequestHandler } from 'express';
import { ValidationException } from '../exceptions/http.exception.ts';

type Source = 'body' | 'params' | 'query';

type FieldRule = {
  type: 'string' | 'number';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
};

export type Schema = Record<string, FieldRule>;

const validateValue = (key: string, value: unknown, rule: FieldRule): unknown => {
  if (value === undefined || value === null || value === '') {
    if (rule.required) throw new ValidationException(`Field "${key}" is required`);
    return undefined;
  }

  if (rule.type === 'string') {
    if (typeof value !== 'string') throw new ValidationException(`Field "${key}" must be a string`);
    if (rule.min !== undefined && value.length < rule.min) {
      throw new ValidationException(`Field "${key}" must be at least ${rule.min} chars`);
    }
    if (rule.max !== undefined && value.length > rule.max) {
      throw new ValidationException(`Field "${key}" must be at most ${rule.max} chars`);
    }
    if (rule.pattern && !rule.pattern.test(value)) {
      throw new ValidationException(`Field "${key}" has invalid format`);
    }
    return value;
  }

  if (rule.type === 'number') {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) throw new ValidationException(`Field "${key}" must be a number`);
    if (rule.min !== undefined && n < rule.min) {
      throw new ValidationException(`Field "${key}" must be >= ${rule.min}`);
    }
    if (rule.max !== undefined && n > rule.max) {
      throw new ValidationException(`Field "${key}" must be <= ${rule.max}`);
    }
    return n;
  }

  return value;
};

export const validate = (source: Source, schema: Schema): RequestHandler => {
  return (req, _res, next) => {
    const raw = req[source] as Record<string, unknown> | undefined;
    const input = raw ?? {};
    const result: Record<string, unknown> = {};
    for (const [key, rule] of Object.entries(schema)) {
      const v = validateValue(key, input[key], rule);
      if (v !== undefined) result[key] = v;
    }
    if (source === 'body') req.body = result;
    else if (source === 'query') (req as unknown as { validatedQuery: Record<string, unknown> }).validatedQuery = result;
    else if (source === 'params') {
      for (const k of Object.keys(result)) {
        (req.params as Record<string, unknown>)[k] = result[k];
      }
    }
    next();
  };
};
