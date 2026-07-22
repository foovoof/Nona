import type { DomainEvent } from '@tos/shared/kernel';

export interface JobEvent extends DomainEvent {
  jobId: string;
  // Event sourcing record for a single job state change
}
