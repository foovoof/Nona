import type { DomainEvent } from '@tos/shared/kernel';

export interface EmergencyRaisedEvent extends DomainEvent {
  eventName: 'EmergencyRaised';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface DriverFlaggedEvent extends DomainEvent {
  eventName: 'DriverFlagged';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface SuspiciousActivityDetectedEvent extends DomainEvent {
  eventName: 'SuspiciousActivityDetected';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface SafetyCaseEscalatedEvent extends DomainEvent {
  eventName: 'SafetyCaseEscalated';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface SafetyCaseResolvedEvent extends DomainEvent {
  eventName: 'SafetyCaseResolved';
  // TODO: define payload
  payload: Record<string, unknown>;
}
