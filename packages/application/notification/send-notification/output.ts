import type { Result } from '@tos/shared/result';

// Output DTO for SendNotification
export interface SendNotificationOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type SendNotificationResult = Result<SendNotificationOutput, Error>;
