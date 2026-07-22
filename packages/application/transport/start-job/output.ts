import type { Result } from '@tos/shared/result';

// Output DTO for StartJob
export interface StartJobOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type StartJobResult = Result<StartJobOutput, Error>;
