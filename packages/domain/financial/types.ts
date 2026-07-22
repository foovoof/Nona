export type TransactionType = 'charge' | 'commission' | 'payout' | 'refund' | 'adjustment';
export type TransactionStatus = 'pending' | 'authorized' | 'captured' | 'settled' | 'failed' | 'refunded';
export type TransactionId = string & { readonly __brand: 'TransactionId' };
export interface WalletEntry { id: string; amount: bigint; currency: string; type: 'credit' | 'debit' | 'hold' | 'release'; }
