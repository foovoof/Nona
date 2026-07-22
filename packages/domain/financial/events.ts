import type { DomainEvent } from '@tos/shared/kernel';

export interface PaymentAuthorizedEvent extends DomainEvent {
  eventName: 'PaymentAuthorized';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface PaymentCapturedEvent extends DomainEvent {
  eventName: 'PaymentCaptured';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface PaymentSettledEvent extends DomainEvent {
  eventName: 'PaymentSettled';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface CommissionCalculatedEvent extends DomainEvent {
  eventName: 'CommissionCalculated';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface RefundIssuedEvent extends DomainEvent {
  eventName: 'RefundIssued';
  // TODO: define payload
  payload: Record<string, unknown>;
}
