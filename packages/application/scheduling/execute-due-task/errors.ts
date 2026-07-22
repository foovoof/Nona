import { DomainError } from '@tos/shared/kernel';

export class ExecuteDueTaskError extends DomainError {
  domain = 'scheduling';
  constructor(public code: string, public message: string) { super(); }
}
