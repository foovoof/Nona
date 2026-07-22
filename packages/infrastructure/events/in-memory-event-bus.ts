import type { DomainEvent } from '@tos/shared/kernel';
export class InMemoryEventBus {
  private handlers = new Map<string, Function[]>();
  async publish(event: DomainEvent) { /* TODO */ }
  subscribe(name: string, handler: Function) { /* TODO */ }
}
