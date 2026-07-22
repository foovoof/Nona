# Use Separate Financial Engine

- **Status:** Accepted
- **Date:** 2026-07-22

## Context

Financial logic (commissions, settlements, refunds) is complex and regulated. Mixing it with job logic creates coupling and compliance risks.

## Decision

Dedicated financial domain handling all monetary operations. Payment gateway integration is infrastructure, not domain.

## Alternatives Considered

1. Inline payment in job completion — simple but creates tight coupling.
2. Full accounting system (double-entry) — correct but over-engineering for MVP.

## Consequences

Positive: auditable, testable, compliant. Negative: eventual consistency with job state.
