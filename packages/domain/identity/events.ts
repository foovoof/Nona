import type { DomainEvent } from '@tos/shared/kernel';

export interface UserRegisteredEvent extends DomainEvent {
  eventName: 'UserRegistered';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface UserProfileUpdatedEvent extends DomainEvent {
  eventName: 'UserProfileUpdated';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface PhoneVerifiedEvent extends DomainEvent {
  eventName: 'PhoneVerified';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface KYCDocumentsSubmittedEvent extends DomainEvent {
  eventName: 'KYCDocumentsSubmitted';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface KYCDocumentsApprovedEvent extends DomainEvent {
  eventName: 'KYCDocumentsApproved';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface DriverApprovedEvent extends DomainEvent {
  eventName: 'DriverApproved';
  // TODO: define payload
  payload: Record<string, unknown>;
}

export interface DriverSuspendedEvent extends DomainEvent {
  eventName: 'DriverSuspended';
  // TODO: define payload
  payload: Record<string, unknown>;
}
