import type { Result } from '@tos/shared/result';

// Output DTO for SetDriverAvailability
export interface SetDriverAvailabilityOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type SetDriverAvailabilityResult = Result<SetDriverAvailabilityOutput, Error>;
