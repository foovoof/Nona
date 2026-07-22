import type { Result } from '@tos/shared/result';

// Output DTO for ScheduleJob
export interface ScheduleJobOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type ScheduleJobResult = Result<ScheduleJobOutput, Error>;
