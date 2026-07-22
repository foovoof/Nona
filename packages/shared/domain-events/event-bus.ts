import type { DomainEvent } from '@tos/shared/kernel';

export interface EventHandler {
  handle(event: DomainEvent): Promise<void>;
}

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventName: string, handler: EventHandler): void;
  unsubscribe(eventName: string, handler: EventHandler): void;
}
