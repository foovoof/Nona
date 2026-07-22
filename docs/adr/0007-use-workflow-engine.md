# Use Declarative Workflow Engine

- **Status:** Accepted
- **Date:** 2026-07-22

## Context

Job lifecycle has 11 states and complex transitions that vary by job type. Hardcoding state machines makes them rigid and hard to test.

## Decision

Define workflows in YAML. The Workflow Engine validates transitions and executes associated actions.

## Alternatives Considered

1. Hardcoded state machines per entity — simpler but rigid and untestable.
2. Full workflow orchestration engine (Temporal, etc.) — powerful but heavy infrastructure.

## Consequences

Positive: testable, auditable, configurable. Negative: YAML management overhead.
