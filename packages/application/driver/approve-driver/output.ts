import type { Result } from '@tos/shared/result';

// Output DTO for ApproveDriver
export interface ApproveDriverOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type ApproveDriverResult = Result<ApproveDriverOutput, Error>;
