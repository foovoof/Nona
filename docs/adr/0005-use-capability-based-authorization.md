# Use Capability-Based Authorization

- **Status:** Accepted
- **Date:** 2026-07-22

## Context

Drivers need granular permissions: which cities they can work in, which vehicle types, which service types, time restrictions. RBAC roles are too coarse.

## Decision

Capability-based model: grant specific capabilities (city_access, vehicle_type, service_type) with scopes and conditions.

## Alternatives Considered

1. RBAC with many roles — role explosion (driver_city1_sedan_ride, driver_city2_suv_delivery...).
2. ABAC with policy engine — powerful but complex to manage and debug.

## Consequences

Positive: fine-grained, composable. Negative: more records per driver.
