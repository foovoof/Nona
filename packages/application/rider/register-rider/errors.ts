import { DomainError } from '@tos/shared/kernel';

export class RegisterRiderError extends DomainError {
  domain = 'rider';
  constructor(public code: string, public message: string) { super(); }
}
