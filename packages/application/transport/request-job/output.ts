import type { Result } from '@tos/shared/result';

// Output DTO for RequestJob
export interface RequestJobOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type RequestJobResult = Result<RequestJobOutput, Error>;
