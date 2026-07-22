import type { Result } from '@tos/shared/result';

// Output DTO for CancelJob
export interface CancelJobOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type CancelJobResult = Result<CancelJobOutput, Error>;
