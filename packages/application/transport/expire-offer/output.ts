import type { Result } from '@tos/shared/result';

// Output DTO for ExpireOffer
export interface ExpireOfferOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type ExpireOfferResult = Result<ExpireOfferOutput, Error>;
