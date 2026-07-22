import { DomainError } from '@tos/shared/kernel';

export class NotificationError extends DomainError {
  domain = 'notification';
  constructor(public code: string, public message: string) { super(); }
}
