import { DomainError } from '@tos/shared/kernel';

export class UpdateDriverLocationError extends DomainError {
  domain = 'driver';
  constructor(public code: string, public message: string) { super(); }
}
