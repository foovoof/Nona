import { DomainError } from '@tos/shared/kernel';

export class DispatchError extends DomainError {
  domain = 'dispatch';
  constructor(public code: string, public message: string) { super(); }
}
