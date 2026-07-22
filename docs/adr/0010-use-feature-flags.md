# Use Feature Flags for Gradual Rollout

- **Status:** Accepted
- **Date:** 2026-07-22

## Context

New features (delivery, VIP, mini-apps) need staged rollout by city and user segment. Big-bang launches are risky.

## Decision

Feature flags with city-based, percentage-based, and capability-based rollout rules. Flags evaluated at runtime.

## Alternatives Considered

1. Deploy per city — simple but creates N deployments.
2. Full feature flag service (LaunchDarkly) — powerful but adds dependency and cost.

## Consequences

Positive: safe rollouts, A/B testing. Negative: flag debt accumulates if not cleaned.
