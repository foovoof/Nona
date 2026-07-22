import type { Result } from '@tos/shared/result';

// Output DTO for SubmitDeliveryProof
export interface SubmitDeliveryProofOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type SubmitDeliveryProofResult = Result<SubmitDeliveryProofOutput, Error>;
