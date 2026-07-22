import { DomainError } from '@tos/shared/kernel';

export class SendNotificationError extends DomainError {
  domain = 'notification';
  constructor(public code: string, public message: string) { super(); }
}
