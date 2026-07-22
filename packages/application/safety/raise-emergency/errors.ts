import { DomainError } from '@tos/shared/kernel';

export class RaiseEmergencyError extends DomainError {
  domain = 'safety';
  constructor(public code: string, public message: string) { super(); }
}
