import type { Result } from '@tos/shared/result';

// Output DTO for LinkTelegramAccount
export interface LinkTelegramAccountOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type LinkTelegramAccountResult = Result<LinkTelegramAccountOutput, Error>;
