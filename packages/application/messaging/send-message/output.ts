import type { Result } from '@tos/shared/result';

// Output DTO for SendMessage
export interface SendMessageOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type SendMessageResult = Result<SendMessageOutput, Error>;
