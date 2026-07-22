import type { DomainEvent } from '@tos/shared/kernel';

export interface MessageSentEvent extends DomainEvent {
  eventName: 'MessageSent';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface MessageReadEvent extends DomainEvent {
  eventName: 'MessageRead';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface ConversationCreatedEvent extends DomainEvent {
  eventName: 'ConversationCreated';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface ConversationClosedEvent extends DomainEvent {
  eventName: 'ConversationClosed';
  // TODO: define payload
  payload: Record<string, unknown>;
}
