# Use Centralized Identity Engine

- **Status:** Accepted
- **Date:** 2026-07-22

## Context

A single user can be both a driver AND a rider. Separate identity systems create confusion and data duplication.

## Decision

Centralized identity domain managing all user types, roles, authentication, and verification.

## Alternatives Considered

1. Separate identity per app — simple but duplicates users.
2. Third-party auth (Auth0, Clerk) — powerful but less control.

## Consequences

Positive: single user model, cross-role capabilities. Negative: complex user schema.
