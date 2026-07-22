# Use Dedicated Scheduling Engine

- **Status:** Accepted
- **Date:** 2026-07-22

## Context

Scheduled rides, recurring tasks, and delayed operations need reliable scheduling. OS cron is insufficient for distributed systems.

## Decision

Dedicated scheduling domain with retry policies, dead-letter handling, and cron-like expressions.

## Alternatives Considered

1. OS crontab — simple but not distributed.
2. External scheduler (Temporal, Bull) — powerful but adds infrastructure.

## Consequences

Positive: reliable, retryable, observable. Negative: needs its own worker process.
