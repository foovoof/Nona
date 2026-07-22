import type { Result } from '@tos/shared/result';

// Output DTO for SettleDriverWallet
export interface SettleDriverWalletOutput {
  // TODO: define output fields
  [key: string]: unknown;
}

export type SettleDriverWalletResult = Result<SettleDriverWalletOutput, Error>;
