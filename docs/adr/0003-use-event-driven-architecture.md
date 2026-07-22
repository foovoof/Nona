# Use Event-Driven Architecture for Cross-Domain Communication

- **Status:** Accepted
- **Date:** 2026-07-22

## Context

Domains need to react to changes in other domains (e.g., job completed → calculate commission → update reputation). Direct coupling creates circular dependencies.

## Decision

Use Domain Events for cross-domain communication. Aggregates raise events; event handlers in other domains react.

## Alternatives Considered

1. Synchronous RPC between domains — simpler but creates coupling and circular dependencies.
2. Message queue only — eventually consistent but adds infrastructure complexity.

## Consequences

Positive: decoupled domains, audit trail via events. Negative: eventual consistency requires careful design.
