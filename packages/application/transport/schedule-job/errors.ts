import { DomainError } from '@tos/shared/kernel';

export class ScheduleJobError extends DomainError {
  domain = 'transport';
  constructor(public code: string, public message: string) { super(); }
}
