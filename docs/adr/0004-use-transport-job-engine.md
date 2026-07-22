# Use Unified Transport Job Engine

- **Status:** Accepted
- **Date:** 2026-07-22

## Context

Rides, deliveries, couriers, airport pickups share 80% of their lifecycle (request → search → offer → accept → complete). Separate entities duplicate logic.

## Decision

Unified TransportJob aggregate with JobType discriminator. Each type has its own metadata schema and workflow definition.

## Alternatives Considered

1. Separate Ride, Delivery, Courier entities — more explicit but massive duplication.
2. Generic "Order" entity — too abstract, loses domain semantics.

## Consequences

Positive: one dispatch engine, one financial flow. Negative: metadata schemas need careful design per type.
