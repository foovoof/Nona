# Use Shared Kernel for Cross-Domain Primitives

- **Status:** Accepted
- **Date:** 2026-07-22

## Context

Entity, AggregateRoot, ValueObject, Money, GeoPoint are needed by every domain. Duplicating them creates inconsistency.

## Decision

Shared Kernel in packages/shared/kernel with the most stable, cross-domain abstractions.

## Alternatives Considered

1. Copy primitives per domain — independent but inconsistent.
2. Full shared library (like NestJS common) — risks becoming a dumping ground.

## Consequences

Positive: consistent DDD patterns. Negative: breaking changes affect all domains.
