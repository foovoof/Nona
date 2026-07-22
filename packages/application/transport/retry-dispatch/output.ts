import type { Result } from '@tos/shared/result';

// Output DTO for RetryDispatch
export interface RetryDispatchOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type RetryDispatchResult = Result<RetryDispatchOutput, Error>;
