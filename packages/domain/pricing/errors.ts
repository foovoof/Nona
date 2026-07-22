import { DomainError } from '@tos/shared/kernel';

export class PricingError extends DomainError {
  domain = 'pricing';
  constructor(public code: string, public message: string) { super(); }
}
