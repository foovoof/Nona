import { DomainError } from '@tos/shared/kernel';

export class CheckCapabilityError extends DomainError {
  domain = 'capability';
  constructor(public code: string, public message: string) { super(); }
}
