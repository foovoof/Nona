import type { DomainEvent } from '@tos/shared/kernel';

export interface EventStore {
  append(event: DomainEvent): Promise<void>;
  getEvents(aggregateId: string): Promise<DomainEvent[]>;
  getEventsByType(eventName: string): Promise<DomainEvent[]>;
}
