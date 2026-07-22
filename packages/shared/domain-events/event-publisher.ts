import type { DomainEvent } from '@tos/shared/kernel';

export interface EventPublisher {
  publishEvents(events: DomainEvent[]): Promise<void>;
}
