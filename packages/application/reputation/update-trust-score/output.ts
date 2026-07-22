import type { Result } from '@tos/shared/result';

// Output DTO for UpdateTrustScore
export interface UpdateTrustScoreOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type UpdateTrustScoreResult = Result<UpdateTrustScoreOutput, Error>;
