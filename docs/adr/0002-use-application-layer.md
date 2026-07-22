# Use Explicit Application Layer

- **Status:** Accepted
- **Date:** 2026-07-22

## Context

Multiple interfaces (Telegram bots, web dashboards, mini-apps, public API) need the same use cases. Without a shared application layer, each interface reimplements orchestration logic.

## Decision

Introduce an Application Layer between Interfaces and Domain. Each use case is a Handler class with typed Input/Output DTOs.

## Alternatives Considered

1. Direct interface-to-domain calls — simpler but leads to duplicated orchestration.
2. CQRS with separate read/write models — powerful but over-engineering for current scale.

## Consequences

Positive: consistent behavior across interfaces. Negative: more files per operation.
