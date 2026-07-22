# Use Dedicated Safety Engine

- **Status:** Accepted
- **Date:** 2026-07-22

## Context

Safety incidents (emergencies, complaints, accidents) need fast, reliable processing. Mixing safety into other domains creates risk.

## Decision

Dedicated safety domain with emergency auto-escalation, suspicious activity detection, and driver flagging.

## Alternatives Considered

1. Inline safety checks in dispatch — simple but easy to miss edge cases.
2. External safety service — adds latency and complexity.

## Consequences

Positive: auditable, fast emergency response. Negative: another domain to maintain.
