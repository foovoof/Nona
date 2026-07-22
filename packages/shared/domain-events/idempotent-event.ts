import type { DomainEvent } from '@tos/shared/kernel';
import type { IdempotencyStore } from '@tos/shared/idempotency';

export async function isEventProcessed(
  store: IdempotencyStore,
  event: DomainEvent
): Promise<boolean> {
  const key = event.idempotencyKey ?? `${event.eventName}_${event.aggregateId}_${event.occurredAt}`;
  return store.check(key);
}
