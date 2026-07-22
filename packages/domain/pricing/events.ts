import type { DomainEvent } from '@tos/shared/kernel';

export interface FareEstimatedEvent extends DomainEvent {
  eventName: 'FareEstimated';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface SurgeLevelChangedEvent extends DomainEvent {
  eventName: 'SurgeLevelChanged';
  // TODO: define payload
  payload: Record<string, unknown>;
}
