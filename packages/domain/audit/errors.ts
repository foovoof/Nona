import { DomainError } from '@tos/shared/kernel';

export class AuditError extends DomainError {
  domain = 'audit';
  constructor(public code: string, public message: string) { super(); }
}
