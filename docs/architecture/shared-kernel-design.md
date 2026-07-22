# Shared Kernel Design

## Three Layers

### packages/shared/kernel/ — Most Stable Abstractions
- `Entity<TId>` — identity-based equality
- `AggregateRoot<TId>` — entity + domain events
- `ValueObject<TProps>` — structural equality, immutable
- `DomainEvent` — event interface with metadata
- `DomainError` — typed business errors

### packages/shared/primitives/ — Cross-Domain Value Objects
- `EntityId` — branded string type
- `Timestamp` — immutable date wrapper
- `Money` — amount (bigint) + currency
- `GeoPoint` — latitude/longitude + Haversine distance
- `PhoneNumber` — E.164 format validation

### packages/shared/utils/ — Guardrail Folder
Only general-purpose, non-domain utilities. No domain logic allowed.

## Anti-Patterns
- ❌ Don't put domain-specific helpers in shared
- ❌ Don't make shared/utils a dumping ground
- ❌ Don't add unstable abstractions to kernel
