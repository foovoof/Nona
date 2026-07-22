import { DomainError } from '@tos/shared/kernel';

export class SubmitDeliveryProofError extends DomainError {
  domain = 'delivery';
  constructor(public code: string, public message: string) { super(); }
}
