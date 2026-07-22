import type { Result } from '@tos/shared/result';

// Output DTO for AcceptOffer
export interface AcceptOfferOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type AcceptOfferResult = Result<AcceptOfferOutput, Error>;
