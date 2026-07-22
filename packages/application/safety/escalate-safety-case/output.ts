import type { Result } from '@tos/shared/result';

// Output DTO for EscalateSafetyCase
export interface EscalateSafetyCaseOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type EscalateSafetyCaseResult = Result<EscalateSafetyCaseOutput, Error>;
