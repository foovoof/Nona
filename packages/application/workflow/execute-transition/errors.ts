import { DomainError } from '@tos/shared/kernel';

export class ExecuteTransitionError extends DomainError {
  domain = 'workflow';
  constructor(public code: string, public message: string) { super(); }
}
