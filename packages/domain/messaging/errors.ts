import { DomainError } from '@tos/shared/kernel';

export class MessagingError extends DomainError {
  domain = 'messaging';
  constructor(public code: string, public message: string) { super(); }
}
