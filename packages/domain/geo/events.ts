import type { DomainEvent } from '@tos/shared/kernel';

export interface ServiceAreaUpdatedEvent extends DomainEvent {
  eventName: 'ServiceAreaUpdated';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface ZoneEnteredEvent extends DomainEvent {
  eventName: 'ZoneEntered';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface ZoneExitedEvent extends DomainEvent {
  eventName: 'ZoneExited';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface GeofenceTriggeredEvent extends DomainEvent {
  eventName: 'GeofenceTriggered';
  // TODO: define payload
  payload: Record<string, unknown>;
}
