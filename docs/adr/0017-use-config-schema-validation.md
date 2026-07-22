# Use Config Schema Validation

- **Status:** Accepted
- **Date:** 2026-07-22

## Context

Environment variables can be missing, wrong type, or malformed. Runtime crashes from bad config are preventable.

## Decision

All config validated via Zod schemas at startup. packages/config is THE ONLY place that reads process.env.

## Alternatives Considered

1. Trust .env files — simple but fragile.
2. Config service (Vault, etc.) — powerful but adds infrastructure.

## Consequences

Positive: fail-fast on bad config, typed config objects. Negative: Zod dependency in config package.
