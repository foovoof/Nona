import { DomainError } from '@tos/shared/kernel';

export class GeoError extends DomainError {
  domain = 'geo';
  constructor(public code: string, public message: string) { super(); }
}
