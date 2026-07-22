import type { DomainEvent } from '@tos/shared/kernel';

export interface JobCreatedEvent extends DomainEvent {
  eventName: 'JobCreated';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface JobStartedEvent extends DomainEvent {
  eventName: 'JobStarted';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface JobCompletedEvent extends DomainEvent {
  eventName: 'JobCompleted';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface JobCancelledEvent extends DomainEvent {
  eventName: 'JobCancelled';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface OfferSentEvent extends DomainEvent {
  eventName: 'OfferSent';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface OfferAcceptedEvent extends DomainEvent {
  eventName: 'OfferAccepted';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface OfferRejectedEvent extends DomainEvent {
  eventName: 'OfferRejected';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface OfferExpiredEvent extends DomainEvent {
  eventName: 'OfferExpired';
  // TODO: define payload
  payload: Record<string, unknown>;
}
