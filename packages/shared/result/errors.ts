import { DomainError } from '@tos/shared/kernel';

export class NotFoundError extends DomainError {
  code = 'NOT_FOUND';
  domain = 'shared';
  constructor(public message: string) { super(); }
}

export class ValidationError extends DomainError {
  code = 'VALIDATION_ERROR';
  domain = 'shared';
  constructor(public message: string) { super(); }
}

export class ConflictError extends DomainError {
  code = 'CONFLICT';
  domain = 'shared';
  constructor(public message: string) { super(); }
}

export class ForbiddenError extends DomainError {
  code = 'FORBIDDEN';
  domain = 'shared';
  constructor(public message: string) { super(); }
}

export class InternalError extends DomainError {
  code = 'INTERNAL_ERROR';
  domain = 'shared';
  constructor(public message: string) { super(); }
}
