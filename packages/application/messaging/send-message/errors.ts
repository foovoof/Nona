import { DomainError } from '@tos/shared/kernel';

export class SendMessageError extends DomainError {
  domain = 'messaging';
  constructor(public code: string, public message: string) { super(); }
}
