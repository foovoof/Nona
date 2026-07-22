import { DomainError } from '@tos/shared/kernel';

export class ConfirmDeliveryOtpError extends DomainError {
  domain = 'delivery';
  constructor(public code: string, public message: string) { super(); }
}
