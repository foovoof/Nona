import { DomainError } from '@tos/shared/kernel';

export class CreateTransactionError extends DomainError {
  domain = 'financial';
  constructor(public code: string, public message: string) { super(); }
}
