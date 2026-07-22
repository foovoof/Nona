import type { Result } from '@tos/shared/result';

// Output DTO for ValidateTransition
export interface ValidateTransitionOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type ValidateTransitionResult = Result<ValidateTransitionOutput, Error>;
