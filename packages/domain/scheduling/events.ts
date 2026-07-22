import type { DomainEvent } from '@tos/shared/kernel';

export interface ScheduledTaskCreatedEvent extends DomainEvent {
  eventName: 'ScheduledTaskCreated';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface ScheduledTaskExecutedEvent extends DomainEvent {
  eventName: 'ScheduledTaskExecuted';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface ScheduledTaskFailedEvent extends DomainEvent {
  eventName: 'ScheduledTaskFailed';
  // TODO: define payload
  payload: Record<string, unknown>;
}
