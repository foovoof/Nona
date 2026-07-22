import type { Result } from '@tos/shared/result';

// Output DTO for SuspendDriver
export interface SuspendDriverOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type SuspendDriverResult = Result<SuspendDriverOutput, Error>;
