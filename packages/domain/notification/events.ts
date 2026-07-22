import type { DomainEvent } from '@tos/shared/kernel';

export interface NotificationSentEvent extends DomainEvent {
  eventName: 'NotificationSent';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface NotificationDeliveredEvent extends DomainEvent {
  eventName: 'NotificationDelivered';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface NotificationFailedEvent extends DomainEvent {
  eventName: 'NotificationFailed';
  // TODO: define payload
  payload: Record<string, unknown>;
}
