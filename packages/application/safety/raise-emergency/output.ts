import type { Result } from '@tos/shared/result';

// Output DTO for RaiseEmergency
export interface RaiseEmergencyOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type RaiseEmergencyResult = Result<RaiseEmergencyOutput, Error>;
