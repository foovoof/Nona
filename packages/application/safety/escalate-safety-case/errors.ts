import { DomainError } from '@tos/shared/kernel';

export class EscalateSafetyCaseError extends DomainError {
  domain = 'safety';
  constructor(public code: string, public message: string) { super(); }
}
