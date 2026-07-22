import type { Schema } from './schema';
import { Result, ok, fail } from '@tos/shared/result';

export function validate<T>(schema: Schema<T>, input: unknown): Result<T, string> {
  const result = schema.safeParse(input);
  return result.success ? ok(result.data) : fail(result.error);
}
