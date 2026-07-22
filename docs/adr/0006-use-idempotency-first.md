# Use Idempotency-First Design

- **Status:** Accepted
- **Date:** 2026-07-22

## Context

Telegram webhooks retry on timeout. Payment callbacks can arrive multiple times. Without idempotency, duplicate processing causes double charges and duplicate jobs.

## Decision

All mutating operations require an idempotency key. The IdempotencyStore tracks processed keys and prevents duplicate execution.

## Alternatives Considered

1. Dedup at application level only — works but each use case reimplements it.
2. Database unique constraints — partial solution, doesn't cover all cases.

## Consequences

Positive: safe retries everywhere. Negative: storage overhead for idempotency keys.
