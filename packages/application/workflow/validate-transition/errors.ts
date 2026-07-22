import { DomainError } from '@tos/shared/kernel';

export class ValidateTransitionError extends DomainError {
  domain = 'workflow';
  constructor(public code: string, public message: string) { super(); }
}
