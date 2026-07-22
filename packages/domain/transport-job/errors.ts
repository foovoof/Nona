import { DomainError } from '@tos/shared/kernel';

export class TransportJobError extends DomainError {
  domain = 'transport-job';
  constructor(public code: string, public message: string) { super(); }
}
