import type { Result } from '@tos/shared/result';

// Output DTO for EvaluatePolicy
export interface EvaluatePolicyOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type EvaluatePolicyResult = Result<EvaluatePolicyOutput, Error>;
