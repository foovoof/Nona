import type { Result } from '@tos/shared/result';

// Output DTO for CreateTransaction
export interface CreateTransactionOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type CreateTransactionResult = Result<CreateTransactionOutput, Error>;
