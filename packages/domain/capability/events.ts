import type { DomainEvent } from '@tos/shared/kernel';

export interface CapabilityGrantedEvent extends DomainEvent {
  eventName: 'CapabilityGranted';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface CapabilityRevokedEvent extends DomainEvent {
  eventName: 'CapabilityRevoked';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface CapabilityExpiredEvent extends DomainEvent {
  eventName: 'CapabilityExpired';
  // TODO: define payload
  payload: Record<string, unknown>;
}
