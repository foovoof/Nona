import type { Result } from '@tos/shared/result';

// Output DTO for RevokeCapability
export interface RevokeCapabilityOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type RevokeCapabilityResult = Result<RevokeCapabilityOutput, Error>;
