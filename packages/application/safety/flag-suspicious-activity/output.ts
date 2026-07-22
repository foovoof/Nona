import type { Result } from '@tos/shared/result';

// Output DTO for FlagSuspiciousActivity
export interface FlagSuspiciousActivityOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type FlagSuspiciousActivityResult = Result<FlagSuspiciousActivityOutput, Error>;
