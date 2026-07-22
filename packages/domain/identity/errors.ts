import { DomainError } from '@tos/shared/kernel';

export class IdentityError extends DomainError {
  domain = 'identity';
  constructor(public code: string, public message: string) { super(); }
}
