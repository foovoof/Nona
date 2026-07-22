import type { Result } from '@tos/shared/result';

// Output DTO for RefundPayment
export interface RefundPaymentOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type RefundPaymentResult = Result<RefundPaymentOutput, Error>;
