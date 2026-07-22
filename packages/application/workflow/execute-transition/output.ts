import type { Result } from '@tos/shared/result';

// Output DTO for ExecuteTransition
export interface ExecuteTransitionOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type ExecuteTransitionResult = Result<ExecuteTransitionOutput, Error>;
