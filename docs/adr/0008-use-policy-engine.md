# Use Externalized Policy Engine

- **Status:** Accepted
- **Date:** 2026-07-22

## Context

Business rules vary by city (cancellation windows, surge caps), service type, and time of day. Hardcoding if/else chains creates maintenance nightmares.

## Decision

Policies defined in YAML files. The Policy Engine evaluates them against a context object and returns allow/deny/modify.

## Alternatives Considered

1. Hardcoded if/else — simple initially, unmaintainable at scale.
2. Full rule engine (Drools, etc.) — powerful but overkill.

## Consequences

Positive: city operators can customize rules. Negative: YAML debugging is harder than code.
