# Use Service Registry

- **Status:** Accepted
- **Date:** 2026-07-22

## Context

Each service type (ride, delivery, VIP, airport) has different requirements for capabilities, vehicle attributes, payment, and proof. These need to be configurable.

## Decision

Service definitions in YAML describe requirements, capabilities, payment support, and rollout rules. Dispatch and Pricing read from the registry.

## Alternatives Considered

1. Hardcoded service configs — fast to build, impossible to maintain.
2. Database-driven service config — flexible but needs admin UI.

## Consequences

Positive: new services via config, not code. Negative: YAML validation needed.
