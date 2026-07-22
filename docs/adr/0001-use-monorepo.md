# Use Monorepo with pnpm + Turborepo

- **Status:** Accepted
- **Date:** 2026-07-22

## Context

TOS has 12+ apps and 10+ shared packages. Separate repos create coordination overhead, versioning nightmares, and duplicated CI.

## Decision

Use a single monorepo with pnpm workspaces and Turborepo for task orchestration.

## Alternatives Considered

1. Polyrepo per app/package — more isolation but massive coordination overhead.
2. Nx monorepo — similar DX but heavier tooling and steeper learning curve.

## Consequences

Positive: single PR touches domain + infrastructure + app. Negative: larger repo, slower initial clone.
