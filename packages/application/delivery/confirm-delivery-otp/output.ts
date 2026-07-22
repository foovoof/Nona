import type { Result } from '@tos/shared/result';

// Output DTO for ConfirmDeliveryOtp
export interface ConfirmDeliveryOtpOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type ConfirmDeliveryOtpResult = Result<ConfirmDeliveryOtpOutput, Error>;
