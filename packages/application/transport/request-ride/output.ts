import type { Result } from '@tos/shared/result';

// Output DTO for RequestRide
export interface RequestRideOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type RequestRideResult = Result<RequestRideOutput, Error>;
