import type { Result } from '@tos/shared/result';

// Output DTO for CompleteJob
export interface CompleteJobOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type CompleteJobResult = Result<CompleteJobOutput, Error>;
