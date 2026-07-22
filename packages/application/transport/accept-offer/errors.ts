import { DomainError } from '@tos/shared/kernel';

export class AcceptOfferError extends DomainError {
  domain = 'transport';
  constructor(public code: string, public message: string) { super(); }
}
