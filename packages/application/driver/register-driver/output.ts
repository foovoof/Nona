import type { Result } from '@tos/shared/result';

// Output DTO for RegisterDriver
export interface RegisterDriverOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type RegisterDriverResult = Result<RegisterDriverOutput, Error>;
