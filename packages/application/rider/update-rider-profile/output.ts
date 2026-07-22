import type { Result } from '@tos/shared/result';

// Output DTO for UpdateRiderProfile
export interface UpdateRiderProfileOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type UpdateRiderProfileResult = Result<UpdateRiderProfileOutput, Error>;
