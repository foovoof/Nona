import type { Result } from '@tos/shared/result';

// Output DTO for VerifyPhone
export interface VerifyPhoneOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type VerifyPhoneResult = Result<VerifyPhoneOutput, Error>;
