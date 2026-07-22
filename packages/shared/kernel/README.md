# Shared Kernel

The most stable, cross-domain abstractions used by every domain.

- `Entity<TId>` — identity-based equality
- `AggregateRoot<TId>` — entity + domain events
- `ValueObject<TProps>` — structural equality, immutable
- `DomainEvent` — event interface with metadata
- `DomainError` — typed business errors
