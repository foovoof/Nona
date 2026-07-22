import type { Result } from '@tos/shared/result';

// Output DTO for CheckCapability
export interface CheckCapabilityOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type CheckCapabilityResult = Result<CheckCapabilityOutput, Error>;
