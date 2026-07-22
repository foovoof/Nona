import type { Result } from '@tos/shared/result';

// Output DTO for CalculateCommission
export interface CalculateCommissionOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type CalculateCommissionResult = Result<CalculateCommissionOutput, Error>;
