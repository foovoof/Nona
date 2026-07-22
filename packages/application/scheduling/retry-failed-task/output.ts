import type { Result } from '@tos/shared/result';

// Output DTO for RetryFailedTask
export interface RetryFailedTaskOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type RetryFailedTaskResult = Result<RetryFailedTaskOutput, Error>;
