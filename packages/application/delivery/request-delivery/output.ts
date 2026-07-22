import type { Result } from '@tos/shared/result';

// Output DTO for RequestDelivery
export interface RequestDeliveryOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type RequestDeliveryResult = Result<RequestDeliveryOutput, Error>;
