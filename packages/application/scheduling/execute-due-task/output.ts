import type { Result } from '@tos/shared/result';

// Output DTO for ExecuteDueTask
export interface ExecuteDueTaskOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type ExecuteDueTaskResult = Result<ExecuteDueTaskOutput, Error>;
