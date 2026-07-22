import { DomainError } from '@tos/shared/kernel';

export class CapabilityError extends DomainError {
  domain = 'capability';
  constructor(public code: string, public message: string) { super(); }
}
