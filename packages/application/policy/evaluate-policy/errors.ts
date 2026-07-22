import { DomainError } from '@tos/shared/kernel';

export class EvaluatePolicyError extends DomainError {
  domain = 'policy';
  constructor(public code: string, public message: string) { super(); }
}
