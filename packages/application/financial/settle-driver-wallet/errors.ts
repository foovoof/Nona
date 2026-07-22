import { DomainError } from '@tos/shared/kernel';

export class SettleDriverWalletError extends DomainError {
  domain = 'financial';
  constructor(public code: string, public message: string) { super(); }
}
