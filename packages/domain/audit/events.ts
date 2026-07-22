import type { DomainEvent } from '@tos/shared/kernel';

export interface AuditRecordedEvent extends DomainEvent {
  eventName: 'AuditRecorded';
  // TODO: define payload
  payload: Record<string, unknown>;
}
