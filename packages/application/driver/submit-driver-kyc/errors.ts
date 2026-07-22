import { DomainError } from '@tos/shared/kernel';

export class SubmitDriverKycError extends DomainError {
  domain = 'driver';
  constructor(public code: string, public message: string) { super(); }
}
