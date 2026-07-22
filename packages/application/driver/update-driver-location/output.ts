import type { Result } from '@tos/shared/result';

// Output DTO for UpdateDriverLocation
export interface UpdateDriverLocationOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type UpdateDriverLocationResult = Result<UpdateDriverLocationOutput, Error>;
