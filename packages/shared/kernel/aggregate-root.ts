import { Entity } from './entity';
import type { DomainEvent } from './domain-event';

export abstract class AggregateRoot<TId> extends Entity<TId> {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): ReadonlyArray<DomainEvent> { return [...this._domainEvents]; }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  protected markUpdated(): void {
    (this as any)._updatedAt = new Date();
  }
}
