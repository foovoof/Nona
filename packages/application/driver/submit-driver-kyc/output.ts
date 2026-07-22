import type { Result } from '@tos/shared/result';

// Output DTO for SubmitDriverKyc
export interface SubmitDriverKycOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type SubmitDriverKycResult = Result<SubmitDriverKycOutput, Error>;
