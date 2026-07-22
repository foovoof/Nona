# TOS V2 — Architecture Overview

## Layer Architecture

```
Interfaces (Telegram · Web · Mini-Apps · Public API)
    │
    ▼
Application Layer (Use Cases · DTOs · Command Handlers)
    │
    ▼
Domain Layer (Entities · Value Objects · Domain Events · Policies)
    │
    ▼
Ports / Contracts (Repository · EventPublisher · External Services)
    │
    ▼
Infrastructure (Supabase · Telegram SDK · Mapbox · Stripe · Redis)
```

## Dependency Rules

- **Interfaces → Application → Domain** (one direction, never reversed)
- **Domain defines Ports; Infrastructure implements them**
- **Domain never imports SDKs, never reads process.env**
- **Config package is the only place reading environment variables**

## Monorepo Structure

| Directory | Purpose |
|-----------|---------|
| `apps/` | 12 deployable applications (bots, dashboards, workers, API) |
| `packages/domain/` | 12 Core + 11 Planned domain bounded contexts |
| `packages/application/` | 44 use cases organized by domain group |
| `packages/infrastructure/` | Adapters for external services |
| `packages/shared/` | Kernel, contracts, primitives, result, events |
| `packages/config/` | Validated environment configuration |
| `docs/` | Architecture docs, ADRs, glossary |

## Event Flow

All cross-domain communication uses Domain Events. Domains never query each other directly.

```
Job Completed (transport-job)
  → Commission Calculated (financial)
  → Trust Score Updated (reputation)
  → Notification Sent (notification)
  → Audit Recorded (audit)
```
