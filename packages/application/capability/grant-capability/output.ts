import type { Result } from '@tos/shared/result';

// Output DTO for GrantCapability
export interface GrantCapabilityOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type GrantCapabilityResult = Result<GrantCapabilityOutput, Error>;
