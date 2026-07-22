import type { Result } from '@tos/shared/result';

// Output DTO for RejectOffer
export interface RejectOfferOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type RejectOfferResult = Result<RejectOfferOutput, Error>;
