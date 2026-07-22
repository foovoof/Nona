import type { DomainEvent } from '@tos/shared/kernel';

export interface DispatchRequestedEvent extends DomainEvent {
  eventName: 'DispatchRequested';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface DriversRankedEvent extends DomainEvent {
  eventName: 'DriversRanked';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface OfferSentEvent extends DomainEvent {
  eventName: 'OfferSent';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface OfferExpiredEvent extends DomainEvent {
  eventName: 'OfferExpired';
  // TODO: define payload
  payload: Record<string, unknown>;
}
