import type { Result } from '@tos/shared/result';

// Output DTO for RegisterRider
export interface RegisterRiderOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type RegisterRiderResult = Result<RegisterRiderOutput, Error>;
