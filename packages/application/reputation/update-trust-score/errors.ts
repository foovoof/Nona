import { DomainError } from '@tos/shared/kernel';

export class UpdateTrustScoreError extends DomainError {
  domain = 'reputation';
  constructor(public code: string, public message: string) { super(); }
}
