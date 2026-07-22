import { DomainError } from '@tos/shared/kernel';

export class SuspendDriverError extends DomainError {
  domain = 'driver';
  constructor(public code: string, public message: string) { super(); }
}
