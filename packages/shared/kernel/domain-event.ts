export interface DomainEvent {
  readonly eventId: string;
  readonly eventName: string;
  readonly eventVersion: number;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly occurredAt: Date;
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly idempotencyKey?: string;
  readonly payload: Record<string, unknown>;
}
