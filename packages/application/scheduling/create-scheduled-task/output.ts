import type { Result } from '@tos/shared/result';

// Output DTO for CreateScheduledTask
export interface CreateScheduledTaskOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type CreateScheduledTaskResult = Result<CreateScheduledTaskOutput, Error>;
