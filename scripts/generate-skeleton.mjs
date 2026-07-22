#!/usr/bin/env node
/**
 * TOS V2 — Architecture Skeleton Generator
 * Generates the complete monorepo structure for Phase -1 + Phase 0.
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';

const ROOT = process.cwd();

function dir(...segments) {
  const p = join(ROOT, ...segments);
  mkdirSync(p, { recursive: true });
  return p;
}

function file(relPath, content) {
  const p = join(ROOT, relPath);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content.replace(/^\n/, ''), 'utf8');
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const DOMAIN_IMPORT = `import { Entity, AggregateRoot, ValueObject, DomainEvent, DomainError } from '@tos/shared/kernel';
import { Result, ok, fail } from '@tos/shared/result';
import type { Port, Repository } from '@tos/shared/contracts';`;

const uc = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const pascal = (s) => s.split('-').map(uc).join('');

// ─────────────────────────────────────────────
// 1. ROOT CONFIG
// ─────────────────────────────────────────────
function genRootConfig() {
  file('package.json', `{
  "name": "tos-v2",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test",
    "typecheck": "turbo typecheck",
    "clean": "turbo clean"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "~5.7.0"
  },
  "packageManager": "pnpm@9.0.0",
  "engines": { "node": ">=20.0.0" }
}
`);

  file('turbo.json', `{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["build"] },
    "typecheck": { "dependsOn": ["^build"] },
    "clean": { "cache": false }
  }
}
`);

  file('tsconfig.base.json', `{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "target": "ES2022",
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "paths": {
      "@tos/shared/*": ["./packages/shared/*"],
      "@tos/domain/*": ["./packages/domain/*"],
      "@tos/application/*": ["./packages/application/*"],
      "@tos/infrastructure/*": ["./packages/infrastructure/*"],
      "@tos/config": ["./packages/config"]
    }
  }
}
`);

  file('pnpm-workspace.yaml', `packages:\n  - 'apps/*'\n  - 'packages/*'\n`);

  file('.gitignore', `node_modules\ndist\n.env\n.env.local\n*.local\n.turbo\n.DS_Store\n`);
}

// ─────────────────────────────────────────────
// 2. GLOSSARY
// ─────────────────────────────────────────────
function genGlossary() {
  const terms = [
    ['TOS', 'Transportation Operating System — the platform that orchestrates transport services.', 'Core Platform'],
    ['Core Platform', 'The shared infrastructure, domain logic, and application layer that powers all TOS surfaces.', 'Core Platform'],
    ['Interface', 'An adapter that connects an external surface (Telegram, Web, API) to the Application Layer. Never calls Domain directly.', 'Architecture'],
    ['Adapter', 'A concrete implementation of a Port. Adapters live in the Infrastructure Layer.', 'Architecture'],
    ['Application Layer', 'Orchestrates domain objects to fulfill use cases. Contains no business rules — only coordination.', 'Architecture'],
    ['Use Case', 'A single application operation (e.g., RequestRide). Has an Input, Output, Handler, and Errors.', 'Architecture'],
    ['Domain', 'A bounded context containing business logic, entities, value objects, and events.', 'Architecture'],
    ['Domain Engine', 'A core subsystem that provides domain-specific logic (e.g., Pricing Engine, Dispatch Engine).', 'Architecture'],
    ['Shared Kernel', 'The most stable cross-domain primitives: Entity, AggregateRoot, ValueObject, DomainEvent, DomainError.', 'Architecture'],
    ['Transport Job', 'The central aggregate representing any transport request. Unified entity supporting ride, delivery, courier, and other job types.', 'Transport'],
    ['Job', 'Short name for Transport Job. A single transport request with a lifecycle defined by a workflow state machine.', 'Transport'],
    ['Ride', 'A Transport Job of type "ride" — passenger transport from origin to destination.', 'Transport'],
    ['Delivery', 'A Transport Job of type "delivery" — package transport from sender to recipient.', 'Transport'],
    ['Courier', 'A Transport Job of type "courier" — multi-stop pickup and dropoff service.', 'Transport'],
    ['Offer', 'A proposal sent to a driver for a specific Job. Contains price, route, and expiration.', 'Dispatch'],
    ['Driver', 'A user with role "driver" who fulfills transport jobs.', 'Identity'],
    ['Rider', 'A user with role "rider" who requests transport services.', 'Identity'],
    ['City Operator', 'A user with role "operator" who manages TOS operations for a specific city.', 'Identity'],
    ['Capability', 'A granted permission (city_access, vehicle_type, service_type) that authorizes a driver for specific work.', 'Capability'],
    ['Scope', 'The boundaries of a Capability grant (e.g., city_id = "city_001").', 'Capability'],
    ['Condition', 'Additional constraints on a Capability (e.g., time_restriction: weekdays only).', 'Capability'],
    ['Policy', 'An externalized business rule that evaluates to allow/deny/modify. Defined in YAML, evaluated by the Policy Engine.', 'Policy'],
    ['Workflow', 'A declarative state machine defining valid state transitions for an aggregate (e.g., Job lifecycle).', 'Workflow'],
    ['Event', 'Something that happened in the system. Events are immutable facts.', 'Architecture'],
    ['Domain Event', 'An Event raised by a Domain aggregate. Carries aggregateId, eventName, payload, correlationId.', 'Architecture'],
    ['Idempotency Key', 'A unique key ensuring an operation is only executed once, even if retried.', 'Infrastructure'],
    ['Service Area', 'A geographic region where a specific service is available.', 'Geo'],
    ['Feature Flag', 'A toggle that enables/disables features per city, user segment, or percentage rollout.', 'Infrastructure'],
    ['Service Registry', 'A catalog of available services (ride, delivery, VIP, etc.) with their requirements and capabilities.', 'Service Registry'],
    ['Identity', 'The domain that manages user accounts, authentication, roles, and profile data.', 'Identity'],
    ['KYC', 'Know Your Customer — identity verification process for drivers.', 'Identity'],
    ['Safety Case', 'A formal record of a safety incident (emergency, complaint, accident) requiring investigation.', 'Safety'],
    ['Reputation', 'The domain that calculates trust scores from ratings, completion rates, and incidents.', 'Reputation'],
    ['Trust Score', 'A composite score (0-100) reflecting a driver/reliability based on multiple signals.', 'Reputation'],
    ['Financial Transaction', 'A monetary operation (charge, commission, payout, refund) tied to a job.', 'Financial'],
    ['Settlement', 'The process of transferring accumulated earnings to a driver wallet or bank account.', 'Financial'],
    ['Bounded Context', 'A clear boundary within which a domain model is defined and applicable.', 'Architecture'],
    ['Aggregate Root', 'The consistency boundary for a cluster of entities. All mutations go through the root.', 'Architecture'],
    ['Entity', 'A domain object defined by its identity. Two entities with the same ID are the same entity.', 'Architecture'],
    ['Value Object', 'An immutable domain object defined by its attributes. Compared by structural equality.', 'Architecture'],
    ['Port', 'An interface defined by the domain/application that infrastructure must implement.', 'Architecture'],
    ['Port Adapter', 'An infrastructure implementation of a Port (e.g., SupabaseRepository implements Repository).', 'Architecture'],
    ['Repository', 'A Port that abstracts persistence for a specific aggregate.', 'Architecture'],
    ['Unit of Work', 'A Port that manages transactional boundaries. All operations in a use case share one transaction.', 'Architecture'],
    ['Command', 'An input DTO representing an intent to change system state (e.g., RequestRideCommand).', 'Architecture'],
    ['DTO', 'Data Transfer Object — a plain object for data exchange between layers. No behavior.', 'Architecture'],
    ['Mapper', 'A function that converts between Domain entities and DTOs. Prevents domain leakage.', 'Architecture'],
    ['City', 'A geographic and administrative unit where TOS operates. Has its own policies, zones, and operators.', 'Geo'],
    ['Zone', 'A subdivision of a City with specific rules (e.g., airport zone, downtown zone).', 'Geo'],
    ['Surge', 'A pricing multiplier applied when demand exceeds supply in a specific area.', 'Pricing'],
    ['Dispatch', 'The process of matching available drivers to transport jobs.', 'Dispatch'],
    ['Assignment', 'The result of dispatch — a specific driver assigned to a specific job.', 'Dispatch'],
    ['Rating', 'A numerical score (1-5) given by rider or driver after a completed job.', 'Reputation'],
  ];

  let md = `# TOS V2 — Glossary\n\n> Unified terminology for the Transportation Operating System.\n> Every term listed here has a single, agreed-upon meaning.\n> Do NOT use alternative names for the same concept.\n\n`;
  let lastCat = '';
  for (const [term, def, cat] of terms) {
    if (cat !== lastCat) { md += `## ${cat}\n\n`; lastCat = cat; }
    md += `### ${term}\n${def}\n\n`;
  }
  file('docs/glossary.md', md);
}

// ─────────────────────────────────────────────
// 3. ADRs
// ─────────────────────────────────────────────
function genADRs() {
  const adrs = [
    ['0001-use-monorepo', 'Use Monorepo with pnpm + Turborepo',
      'TOS has 12+ apps and 10+ shared packages. Separate repos create coordination overhead, versioning nightmares, and duplicated CI.',
      'Use a single monorepo with pnpm workspaces and Turborepo for task orchestration.',
      ['Polyrepo per app/package — more isolation but massive coordination overhead.', 'Nx monorepo — similar DX but heavier tooling and steeper learning curve.'],
      'Positive: single PR touches domain + infrastructure + app. Negative: larger repo, slower initial clone.'],
    ['0002-use-application-layer', 'Use Explicit Application Layer',
      'Multiple interfaces (Telegram bots, web dashboards, mini-apps, public API) need the same use cases. Without a shared application layer, each interface reimplements orchestration logic.',
      'Introduce an Application Layer between Interfaces and Domain. Each use case is a Handler class with typed Input/Output DTOs.',
      ['Direct interface-to-domain calls — simpler but leads to duplicated orchestration.', 'CQRS with separate read/write models — powerful but over-engineering for current scale.'],
      'Positive: consistent behavior across interfaces. Negative: more files per operation.'],
    ['0003-use-event-driven-architecture', 'Use Event-Driven Architecture for Cross-Domain Communication',
      'Domains need to react to changes in other domains (e.g., job completed → calculate commission → update reputation). Direct coupling creates circular dependencies.',
      'Use Domain Events for cross-domain communication. Aggregates raise events; event handlers in other domains react.',
      ['Synchronous RPC between domains — simpler but creates coupling and circular dependencies.', 'Message queue only — eventually consistent but adds infrastructure complexity.'],
      'Positive: decoupled domains, audit trail via events. Negative: eventual consistency requires careful design.'],
    ['0004-use-transport-job-engine', 'Use Unified Transport Job Engine',
      'Rides, deliveries, couriers, airport pickups share 80% of their lifecycle (request → search → offer → accept → complete). Separate entities duplicate logic.',
      'Unified TransportJob aggregate with JobType discriminator. Each type has its own metadata schema and workflow definition.',
      ['Separate Ride, Delivery, Courier entities — more explicit but massive duplication.', 'Generic "Order" entity — too abstract, loses domain semantics.'],
      'Positive: one dispatch engine, one financial flow. Negative: metadata schemas need careful design per type.'],
    ['0005-use-capability-based-authorization', 'Use Capability-Based Authorization',
      'Drivers need granular permissions: which cities they can work in, which vehicle types, which service types, time restrictions. RBAC roles are too coarse.',
      'Capability-based model: grant specific capabilities (city_access, vehicle_type, service_type) with scopes and conditions.',
      ['RBAC with many roles — role explosion (driver_city1_sedan_ride, driver_city2_suv_delivery...).', 'ABAC with policy engine — powerful but complex to manage and debug.'],
      'Positive: fine-grained, composable. Negative: more records per driver.'],
    ['0006-use-idempotency-first', 'Use Idempotency-First Design',
      'Telegram webhooks retry on timeout. Payment callbacks can arrive multiple times. Without idempotency, duplicate processing causes double charges and duplicate jobs.',
      'All mutating operations require an idempotency key. The IdempotencyStore tracks processed keys and prevents duplicate execution.',
      ['Dedup at application level only — works but each use case reimplements it.', 'Database unique constraints — partial solution, doesn\'t cover all cases.'],
      'Positive: safe retries everywhere. Negative: storage overhead for idempotency keys.'],
    ['0007-use-workflow-engine', 'Use Declarative Workflow Engine',
      'Job lifecycle has 11 states and complex transitions that vary by job type. Hardcoding state machines makes them rigid and hard to test.',
      'Define workflows in YAML. The Workflow Engine validates transitions and executes associated actions.',
      ['Hardcoded state machines per entity — simpler but rigid and untestable.', 'Full workflow orchestration engine (Temporal, etc.) — powerful but heavy infrastructure.'],
      'Positive: testable, auditable, configurable. Negative: YAML management overhead.'],
    ['0008-use-policy-engine', 'Use Externalized Policy Engine',
      'Business rules vary by city (cancellation windows, surge caps), service type, and time of day. Hardcoding if/else chains creates maintenance nightmares.',
      'Policies defined in YAML files. The Policy Engine evaluates them against a context object and returns allow/deny/modify.',
      ['Hardcoded if/else — simple initially, unmaintainable at scale.', 'Full rule engine (Drools, etc.) — powerful but overkill.'],
      'Positive: city operators can customize rules. Negative: YAML debugging is harder than code.'],
    ['0009-use-service-registry', 'Use Service Registry',
      'Each service type (ride, delivery, VIP, airport) has different requirements for capabilities, vehicle attributes, payment, and proof. These need to be configurable.',
      'Service definitions in YAML describe requirements, capabilities, payment support, and rollout rules. Dispatch and Pricing read from the registry.',
      ['Hardcoded service configs — fast to build, impossible to maintain.', 'Database-driven service config — flexible but needs admin UI.'],
      'Positive: new services via config, not code. Negative: YAML validation needed.'],
    ['0010-use-feature-flags', 'Use Feature Flags for Gradual Rollout',
      'New features (delivery, VIP, mini-apps) need staged rollout by city and user segment. Big-bang launches are risky.',
      'Feature flags with city-based, percentage-based, and capability-based rollout rules. Flags evaluated at runtime.',
      ['Deploy per city — simple but creates N deployments.', 'Full feature flag service (LaunchDarkly) — powerful but adds dependency and cost.'],
      'Positive: safe rollouts, A/B testing. Negative: flag debt accumulates if not cleaned.'],
    ['0011-use-scheduling-engine', 'Use Dedicated Scheduling Engine',
      'Scheduled rides, recurring tasks, and delayed operations need reliable scheduling. OS cron is insufficient for distributed systems.',
      'Dedicated scheduling domain with retry policies, dead-letter handling, and cron-like expressions.',
      ['OS crontab — simple but not distributed.', 'External scheduler (Temporal, Bull) — powerful but adds infrastructure.'],
      'Positive: reliable, retryable, observable. Negative: needs its own worker process.'],
    ['0012-use-identity-engine', 'Use Centralized Identity Engine',
      'A single user can be both a driver AND a rider. Separate identity systems create confusion and data duplication.',
      'Centralized identity domain managing all user types, roles, authentication, and verification.',
      ['Separate identity per app — simple but duplicates users.', 'Third-party auth (Auth0, Clerk) — powerful but less control.'],
      'Positive: single user model, cross-role capabilities. Negative: complex user schema.'],
    ['0013-use-safety-engine', 'Use Dedicated Safety Engine',
      'Safety incidents (emergencies, complaints, accidents) need fast, reliable processing. Mixing safety into other domains creates risk.',
      'Dedicated safety domain with emergency auto-escalation, suspicious activity detection, and driver flagging.',
      ['Inline safety checks in dispatch — simple but easy to miss edge cases.', 'External safety service — adds latency and complexity.'],
      'Positive: auditable, fast emergency response. Negative: another domain to maintain.'],
    ['0014-use-financial-engine', 'Use Separate Financial Engine',
      'Financial logic (commissions, settlements, refunds) is complex and regulated. Mixing it with job logic creates coupling and compliance risks.',
      'Dedicated financial domain handling all monetary operations. Payment gateway integration is infrastructure, not domain.',
      ['Inline payment in job completion — simple but creates tight coupling.', 'Full accounting system (double-entry) — correct but over-engineering for MVP.'],
      'Positive: auditable, testable, compliant. Negative: eventual consistency with job state.'],
    ['0015-use-shared-kernel', 'Use Shared Kernel for Cross-Domain Primitives',
      'Entity, AggregateRoot, ValueObject, Money, GeoPoint are needed by every domain. Duplicating them creates inconsistency.',
      'Shared Kernel in packages/shared/kernel with the most stable, cross-domain abstractions.',
      ['Copy primitives per domain — independent but inconsistent.', 'Full shared library (like NestJS common) — risks becoming a dumping ground.'],
      'Positive: consistent DDD patterns. Negative: breaking changes affect all domains.'],
    ['0016-use-domain-classification', 'Use Domain Classification (Core / Planned / Future)',
      'Building all 35 domains upfront is impractical. Need a way to prioritize and defer.',
      'Classify domains: Core (full structure now), Planned (contracts only), Future (documentation only).',
      ['Build everything — thorough but takes forever.', 'Build only what\'s needed — fast but no architectural guidance for future.'],
      'Positive: clear priorities, extensible structure. Negative: classification needs periodic review.'],
    ['0017-use-config-schema-validation', 'Use Config Schema Validation',
      'Environment variables can be missing, wrong type, or malformed. Runtime crashes from bad config are preventable.',
      'All config validated via Zod schemas at startup. packages/config is THE ONLY place that reads process.env.',
      ['Trust .env files — simple but fragile.', 'Config service (Vault, etc.) — powerful but adds infrastructure.'],
      'Positive: fail-fast on bad config, typed config objects. Negative: Zod dependency in config package.'],
    ['0018-use-glossary', 'Use Unified Glossary',
      'Terms like Trip/Ride/Job/Request/Order cause confusion across teams. Miscommunication leads to bugs.',
      'Maintain docs/glossary.md with all domain terms. Every term has one meaning. Alternative names are documented as aliases.',
      ['No glossary — rely on context. Fails at scale.', 'Full ontology (OWL, etc.) — overkill for a startup.'],
      'Positive: clear communication, onboarding aid. Negative: requires maintenance.'],
  ];

  for (const [id, title, context, decision, alternatives, consequences] of adrs) {
    file(`docs/adr/${id}.md`, `# ${title.replace(/^\\d+-/, '')}

- **Status:** Accepted
- **Date:** 2026-07-22

## Context

${context}

## Decision

${decision}

## Alternatives Considered

${alternatives.map((a, i) => `${i + 1}. ${a}`).join('\n')}

## Consequences

${consequences}
`);
  }
}

// ─────────────────────────────────────────────
// 4. ARCHITECTURE DOCS
// ─────────────────────────────────────────────
function genArchDocs() {
  file('docs/architecture/overview.md', `# TOS V2 — Architecture Overview

## Layer Architecture

\`\`\`
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
\`\`\`

## Dependency Rules

- **Interfaces → Application → Domain** (one direction, never reversed)
- **Domain defines Ports; Infrastructure implements them**
- **Domain never imports SDKs, never reads process.env**
- **Config package is the only place reading environment variables**

## Monorepo Structure

| Directory | Purpose |
|-----------|---------|
| \`apps/\` | 12 deployable applications (bots, dashboards, workers, API) |
| \`packages/domain/\` | 12 Core + 11 Planned domain bounded contexts |
| \`packages/application/\` | 44 use cases organized by domain group |
| \`packages/infrastructure/\` | Adapters for external services |
| \`packages/shared/\` | Kernel, contracts, primitives, result, events |
| \`packages/config/\` | Validated environment configuration |
| \`docs/\` | Architecture docs, ADRs, glossary |

## Event Flow

All cross-domain communication uses Domain Events. Domains never query each other directly.

\`\`\`
Job Completed (transport-job)
  → Commission Calculated (financial)
  → Trust Score Updated (reputation)
  → Notification Sent (notification)
  → Audit Recorded (audit)
\`\`\`
`);

  file('docs/architecture/dependency-rules.md', `# Dependency Rules

## Per-Layer Import Rules

### Domain Layer
✅ self, @tos/shared/kernel, @tos/shared/primitives, @tos/shared/contracts, @tos/shared/result
❌ Infrastructure, Apps, SDKs, process.env, other domain internals

### Application Layer
✅ Domain ports, @tos/shared/*, @tos/config contracts
❌ SDK details (Supabase, Telegram, Mapbox), process.env directly

### Infrastructure Layer
✅ Ports (to implement), @tos/shared/*, SDKs, @tos/config
❌ Domain internals (entities, value objects, policies)

### Interfaces Layer
✅ Application use cases, DTOs, mappers, @tos/config
❌ Domain directly (must go through Application Layer)

### Config Package
✅ process.env (THE ONLY PLACE), zod for validation
❌ Nothing else reads env
`);

  file('docs/architecture/bounded-context-map.md', `# Bounded Context Map

## Contexts

| Context | Responsibility | Relationship Type |
|---------|---------------|-------------------|
| **Shared Kernel** | Entity, AggregateRoot, ValueObject, Money, GeoPoint | Partnership (all) |
| **Transport Job** | Job lifecycle, types, state machine | Customer: pricing, dispatch. Supplier: financial, audit |
| **Dispatch** | Driver-job matching, offer management | Customer: transport-job, pricing, capability, safety, service-registry |
| **Pricing** | Fare calculation, surge, commission | Supplier: dispatch, financial |
| **Scheduling** | Scheduled tasks, cron, retry | Customer: transport-job, dispatch |
| **Identity** | User accounts, auth, roles, KYC | Supplier: capability, safety |
| **Capability** | Authorization grants, scopes | Customer: identity. Supplier: dispatch |
| **Safety** | Emergencies, flags, investigations | Customer: identity |
| **Financial** | Transactions, settlements, wallets | Customer: transport-job, pricing |
| **Audit** | Event logging, compliance | Customer: ALL (observes events) |
| **Notification** | Push, SMS, email delivery | Customer: ALL (consumed by all) |
| **Messaging** | In-app chat between parties | Customer: identity, notification |
| **Geo** | Service areas, zones, geofencing | Supplier: transport-job, dispatch, pricing |
| **Service Registry** | Service definitions and requirements | Published Language (read by dispatch, pricing) |
| **Policy** | Business rule evaluation | Published Language (read by capability, dispatch) |
| **Workflow** | State machine definitions | Published Language (read by all stateful domains) |
`);

  file('docs/architecture/domain-classification.md', `# Domain Classification

## Core Domains (full structure — 12)

| Domain | Why Core |
|--------|----------|
| transport-job | Central aggregate, everything depends on it |
| dispatch | Critical path for every job |
| pricing | Every job needs a price |
| scheduling | Scheduled rides, recurring tasks |
| identity | All users need accounts |
| capability | Driver authorization is critical |
| safety | Emergency handling cannot be deferred |
| financial | Money flow is core business |
| audit | Compliance requires audit trail from day 1 |
| notification | Users need feedback on every action |
| messaging | Rider-driver communication is essential |
| geo | Location is fundamental to transport |

## Planned Domains (lightweight — 11)

| Domain | Why Planned | Notes |
|--------|------------|-------|
| delivery | Deferred proof/OTP | Job lifecycle in transport-job |
| reputation | Needs job history data | Contracts defined |
| policy | Core contracts defined | Implementation deferred |
| workflow | Core contracts defined | Implementation deferred |
| service-registry | Core contracts defined | Implementation deferred |
| feature-flags | Cross-cutting concern | Lives in packages/config |
| operations-intelligence | Needs event sourcing | Prerequisites documented |
| support | Needs stable core flow | After MVP |
| emergency | Merged into safety | Directory kept for extraction |
| documents | Supabase Storage suffices | For now |
| kyc | Merged into identity | Directory kept for extraction |

## Future Domains (docs only — 12)

fleet, corporate, government, shuttle, rental, fraud, risk, advanced-analytics, ai-optimization, advanced-settlements, marketplace, external-partner-api

See: \`docs/roadmap/future-domains.md\`
`);

  file('docs/architecture/shared-kernel-design.md', `# Shared Kernel Design

## Three Layers

### packages/shared/kernel/ — Most Stable Abstractions
- \`Entity<TId>\` — identity-based equality
- \`AggregateRoot<TId>\` — entity + domain events
- \`ValueObject<TProps>\` — structural equality, immutable
- \`DomainEvent\` — event interface with metadata
- \`DomainError\` — typed business errors

### packages/shared/primitives/ — Cross-Domain Value Objects
- \`EntityId\` — branded string type
- \`Timestamp\` — immutable date wrapper
- \`Money\` — amount (bigint) + currency
- \`GeoPoint\` — latitude/longitude + Haversine distance
- \`PhoneNumber\` — E.164 format validation

### packages/shared/utils/ — Guardrail Folder
Only general-purpose, non-domain utilities. No domain logic allowed.

## Anti-Patterns
- ❌ Don't put domain-specific helpers in shared
- ❌ Don't make shared/utils a dumping ground
- ❌ Don't add unstable abstractions to kernel
`);

  file('docs/roadmap/future-domains.md', `# Future Domains

| Domain | Why Deferred | When Needed | Related Core Domains |
|--------|-------------|-------------|---------------------|
| fleet | Fleet management is B2B feature | When corporate clients onboard | transport-job, identity, capability |
| corporate | Corporate accounts, billing | Enterprise sales phase | financial, identity |
| government | Government contracts, compliance | Regulatory expansion | identity, audit, safety |
| shuttle | Shared ride shuttle service | Multi-passenger feature | transport-job, dispatch, scheduling |
| rental | Long-term vehicle rental | Rental service launch | transport-job, financial, identity |
| fraud | Fraud detection and prevention | After financial scale | financial, identity, audit |
| risk | Risk assessment and mitigation | After safety incidents scale | safety, reputation, financial |
| advanced-analytics | Business intelligence, dashboards | After operational data matures | audit, financial |
| ai-optimization | AI-powered dispatch and pricing | After enough training data | dispatch, pricing |
| advanced-settlements | Multi-currency, cross-border | International expansion | financial |
| marketplace | Driver marketplace, bidding | After supply exceeds demand | dispatch, pricing |
| external-partner-api | Partner integrations | B2B partnerships | all |
`);

  // Doc indexes
  for (const [dir, title] of [
    ['domains', 'Domain Documentation Index'],
    ['workflows', 'Workflow Documentation'],
    ['database', 'Database Documentation'],
    ['api', 'API Documentation'],
    ['operations', 'Operations Documentation'],
    ['security', 'Security Documentation'],
    ['deployment', 'Deployment Documentation'],
  ]) {
    file(`docs/${dir}/README.md`, `# ${title}\n\n> Placeholder — detailed documentation will be added as features are implemented.\n`);
  }
}

// ─────────────────────────────────────────────
// 5. SHARED PACKAGE
// ─────────────────────────────────────────────
function genShared() {
  // kernel
  file('packages/shared/kernel/entity.ts', `export abstract class Entity<TId> {
  protected readonly _id: TId;
  protected readonly _createdAt: Date;
  protected _updatedAt: Date;

  constructor(id: TId, createdAt?: Date, updatedAt?: Date) {
    this._id = id;
    this._createdAt = createdAt ?? new Date();
    this._updatedAt = updatedAt ?? new Date();
  }

  get id(): TId { return this._id; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  equals(other: Entity<TId>): boolean {
    if (!other) return false;
    if (this === other) return true;
    return this._id === other._id;
  }
}
`);

  file('packages/shared/kernel/aggregate-root.ts', `import { Entity } from './entity';
import type { DomainEvent } from './domain-event';

export abstract class AggregateRoot<TId> extends Entity<TId> {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): ReadonlyArray<DomainEvent> { return [...this._domainEvents]; }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  protected markUpdated(): void {
    (this as any)._updatedAt = new Date();
  }
}
`);

  file('packages/shared/kernel/value-object.ts', `export abstract class ValueObject<TProps> {
  protected readonly props: TProps;

  constructor(props: TProps) {
    this.props = Object.freeze(props);
  }

  equals(other: ValueObject<TProps>): boolean {
    if (!other) return false;
    if (this === other) return true;
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }
}
`);

  file('packages/shared/kernel/domain-event.ts', `export interface DomainEvent {
  readonly eventId: string;
  readonly eventName: string;
  readonly eventVersion: number;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly occurredAt: Date;
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly idempotencyKey?: string;
  readonly payload: Record<string, unknown>;
}
`);

  file('packages/shared/kernel/domain-error.ts', `export abstract class DomainError {
  abstract readonly code: string;
  abstract readonly message: string;
  abstract readonly domain: string;

  toJSON() {
    return { code: this.code, message: this.message, domain: this.domain };
  }
}
`);

  file('packages/shared/kernel/index.ts', `export { Entity } from './entity';
export { AggregateRoot } from './aggregate-root';
export { ValueObject } from './value-object';
export type { DomainEvent } from './domain-event';
export { DomainError } from './domain-error';
`);

  file('packages/shared/kernel/README.md', `# Shared Kernel\n\nThe most stable, cross-domain abstractions used by every domain.\n\n- \`Entity<TId>\` — identity-based equality\n- \`AggregateRoot<TId>\` — entity + domain events\n- \`ValueObject<TProps>\` — structural equality, immutable\n- \`DomainEvent\` — event interface with metadata\n- \`DomainError\` — typed business errors\n`);

  // contracts
  file('packages/shared/contracts/port.ts', `export interface Port {
  readonly name: string;
}
`);

  file('packages/shared/contracts/repository.ts', `export interface Repository<TEntity, TId> {
  findById(id: TId): Promise<TEntity | null>;
  save(entity: TEntity): Promise<void>;
  delete(id: TId): Promise<void>;
}
`);

  file('packages/shared/contracts/unit-of-work.ts', `export interface UnitOfWork {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  execute<T>(fn: () => Promise<T>): Promise<T>;
}
`);

  file('packages/shared/contracts/index.ts', `export type { Port } from './port';
export type { Repository } from './repository';
export type { UnitOfWork } from './unit-of-work';
`);

  file('packages/shared/contracts/README.md', `# Contracts\n\nPort, Repository, and UnitOfWork interfaces that infrastructure must implement.\n`);

  // primitives
  file('packages/shared/primitives/id.ts', `import { randomUUID } from 'crypto';

export type Brand<T, B extends string> = T & { readonly __brand: B };
export type EntityId = Brand<string, 'EntityId'>;

export function generateId(prefix?: string): string {
  const uuid = randomUUID();
  return prefix ? \`\${prefix}_\${uuid}\` : uuid;
}
`);

  file('packages/shared/primitives/timestamp.ts', `export class Timestamp {
  private readonly value: Date;

  private constructor(date: Date) { this.value = date; }

  static now(): Timestamp { return new Timestamp(new Date()); }
  static fromISO(iso: string): Timestamp { return new Timestamp(new Date(iso)); }

  toISO(): string { return this.value.toISOString(); }
  toDate(): Date { return new Date(this.value); }
  isBefore(other: Timestamp): boolean { return this.value < other.value; }
  isAfter(other: Timestamp): boolean { return this.value > other.value; }
}
`);

  file('packages/shared/primitives/money.ts', `export class Money {
  private readonly amount: bigint;
  private readonly currency: string;

  constructor(amount: bigint, currency: string) {
    this.amount = amount;
    this.currency = currency.toUpperCase();
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) throw new Error('Currency mismatch');
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) throw new Error('Currency mismatch');
    return new Money(this.amount - other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(BigInt(Math.round(Number(this.amount) * factor)), this.currency);
  }

  isGreaterThan(other: Money): boolean {
    return this.amount > other.amount;
  }

  isZero(): boolean { return this.amount === 0n; }
  toNumber(): number { return Number(this.amount); }
  toString(): string { return \`\${this.currency} \${this.amount}\`; }
}
`);

  file('packages/shared/primitives/geo-point.ts', `export class GeoPoint {
  readonly latitude: number;
  readonly longitude: number;

  constructor(latitude: number, longitude: number) {
    if (latitude < -90 || latitude > 90) throw new Error('Invalid latitude');
    if (longitude < -180 || longitude > 180) throw new Error('Invalid longitude');
    this.latitude = latitude;
    this.longitude = longitude;
  }

  distanceTo(other: GeoPoint): number {
    const R = 6371;
    const dLat = (other.latitude - this.latitude) * Math.PI / 180;
    const dLon = (other.longitude - this.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(this.latitude*Math.PI/180) * Math.cos(other.latitude*Math.PI/180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }
}
`);

  file('packages/shared/primitives/phone-number.ts', `export class PhoneNumber {
  readonly countryCode: string;
  readonly number: string;

  constructor(countryCode: string, number: string) {
    this.countryCode = countryCode;
    this.number = number;
  }

  format(): string { return \`+\${this.countryCode}\${this.number}\`; }

  static isValid(countryCode: string, number: string): boolean {
    return /^\\d{1,4}$/.test(countryCode) && /^\\d{6,15}$/.test(number);
  }
}
`);

  file('packages/shared/primitives/index.ts', `export { generateId, type Brand, type EntityId } from './id';
export { Timestamp } from './timestamp';
export { Money } from './money';
export { GeoPoint } from './geo-point';
export { PhoneNumber } from './phone-number');
`);

  file('packages/shared/primitives/README.md', `# Primitives\n\nCross-domain Value Objects used by multiple domains.\n- \`EntityId\` — branded string type\n- \`Timestamp\` — immutable date wrapper\n- \`Money\` — bigint amount + currency\n- \`GeoPoint\` — lat/lng + Haversine distance\n- \`PhoneNumber\` — E.164 format\n`);

  // result
  file('packages/shared/result/result.ts', `export type Result<T, E> = Ok<T> | Fail<E>;

export class Ok<T> {
  readonly ok = true as const;
  constructor(readonly value: T) {}
}

export class Fail<E> {
  readonly ok = false as const;
  constructor(readonly error: E) {}
}

export const ok = <T>(value: T): Result<T, never> => new Ok(value);
export const fail = <E>(error: E): Result<never, E> => new Fail(error);
`);

  file('packages/shared/result/errors.ts', `import { DomainError } from '@tos/shared/kernel';

export class NotFoundError extends DomainError {
  code = 'NOT_FOUND';
  domain = 'shared';
  constructor(public message: string) { super(); }
}

export class ValidationError extends DomainError {
  code = 'VALIDATION_ERROR';
  domain = 'shared';
  constructor(public message: string) { super(); }
}

export class ConflictError extends DomainError {
  code = 'CONFLICT';
  domain = 'shared';
  constructor(public message: string) { super(); }
}

export class ForbiddenError extends DomainError {
  code = 'FORBIDDEN';
  domain = 'shared';
  constructor(public message: string) { super(); }
}

export class InternalError extends DomainError {
  code = 'INTERNAL_ERROR';
  domain = 'shared';
  constructor(public message: string) { super(); }
}
`);

  file('packages/shared/result/index.ts', `export { type Result, Ok, Fail, ok, fail } from './result';
export { NotFoundError, ValidationError, ConflictError, ForbiddenError, InternalError } from './errors';
`);

  file('packages/shared/result/README.md', `# Result\n\nResult<T,E> monad for explicit success/failure handling.\nUse Cases return Result instead of throwing exceptions.\n`);

  // validation
  file('packages/shared/validation/schema.ts', `export interface Schema<T> {
  parse(input: unknown): T;
  safeParse(input: unknown): { success: true; data: T } | { success: false; error: string };
}
`);

  file('packages/shared/validation/validator.ts', `import type { Schema } from './schema';
import { Result, ok, fail } from '@tos/shared/result';

export function validate<T>(schema: Schema<T>, input: unknown): Result<T, string> {
  const result = schema.safeParse(input);
  return result.success ? ok(result.data) : fail(result.error);
}
`);

  file('packages/shared/validation/index.ts', `export type { Schema } from './schema';
export { validate } from './validator';
`);

  file('packages/shared/validation/README.md', `# Validation\n\nSchema validation wrappers. Use Zod schemas that implement the Schema interface.\n`);

  // idempotency
  file('packages/shared/idempotency/idempotency-key.ts', `import { createHash } from 'crypto';

export class IdempotencyKey {
  private readonly key: string;

  constructor(key: string) {
    if (!key || key.length < 8) throw new Error('Idempotency key too short');
    this.key = key;
  }

  static generate(prefix: string): IdempotencyKey {
    const hash = createHash('sha256').update(\`\${prefix}_\${Date.now()}_\${Math.random()}\`).digest('hex');
    return new IdempotencyKey(\`\${prefix}_\${hash.substring(0, 16)}\`);
  }

  toString(): string { return this.key; }

  static isValid(key: string): boolean { return key.length >= 8; }
}
`);

  file('packages/shared/idempotency/idempotency-store.ts', `export interface IdempotencyStore {
  check(key: string): Promise<boolean>;
  store(key: string, result: unknown, ttlSeconds?: number): Promise<void>;
  get(key: string): Promise<unknown | null>;
}
`);

  file('packages/shared/idempotency/processed-webhook.ts', `export interface ProcessedWebhook {
  webhookId: string;
  source: string;
  processedAt: Date;
  result: 'success' | 'failed' | 'skipped';
}
`);

  file('packages/shared/idempotency/consistency-lock.ts', `export interface ConsistencyLock {
  acquire(key: string, ttlSeconds: number): Promise<boolean>;
  release(key: string): Promise<void>;
}
`);

  file('packages/shared/idempotency/optimistic-lock.ts', `export interface OptimisticLock {
  version: number;
  updatedAt: Date;
}

export function checkVersion(current: OptimisticLock, expected: number): boolean {
  return current.version === expected;
}
`);

  file('packages/shared/idempotency/index.ts', `export { IdempotencyKey } from './idempotency-key';
export type { IdempotencyStore } from './idempotency-store';
export type { ProcessedWebhook } from './processed-webhook';
export type { ConsistencyLock } from './consistency-lock';
export { type OptimisticLock, checkVersion } from './optimistic-lock';
`);

  file('packages/shared/idempotency/README.md', `# Idempotency\n\nIdempotencyKey, IdempotencyStore, ConsistencyLock, OptimisticLock.\nAll mutating operations require idempotency keys.\n`);

  // domain-events
  file('packages/shared/domain-events/event-bus.ts', `import type { DomainEvent } from '@tos/shared/kernel';

export interface EventHandler {
  handle(event: DomainEvent): Promise<void>;
}

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventName: string, handler: EventHandler): void;
  unsubscribe(eventName: string, handler: EventHandler): void;
}
`);

  file('packages/shared/domain-events/event-store.ts', `import type { DomainEvent } from '@tos/shared/kernel';

export interface EventStore {
  append(event: DomainEvent): Promise<void>;
  getEvents(aggregateId: string): Promise<DomainEvent[]>;
  getEventsByType(eventName: string): Promise<DomainEvent[]>;
}
`);

  file('packages/shared/domain-events/event-publisher.ts', `import type { DomainEvent } from '@tos/shared/kernel';

export interface EventPublisher {
  publishEvents(events: DomainEvent[]): Promise<void>;
}
`);

  file('packages/shared/domain-events/event-names.ts', `/** Canonical event names — use these constants, never raw strings. */
export const EVENT_NAMES = {
  RIDE_REQUESTED: 'RideRequested',
  DELIVERY_REQUESTED: 'DeliveryRequested',
  JOB_CREATED: 'JobCreated',
  DRIVERS_RANKED: 'DriversRanked',
  OFFER_SENT: 'OfferSent',
  OFFER_EXPIRED: 'OfferExpired',
  OFFER_ACCEPTED: 'OfferAccepted',
  OFFER_REJECTED: 'OfferRejected',
  JOB_STARTED: 'JobStarted',
  JOB_COMPLETED: 'JobCompleted',
  JOB_CANCELLED: 'JobCancelled',
  PAYMENT_AUTHORIZED: 'PaymentAuthorized',
  PAYMENT_CAPTURED: 'PaymentCaptured',
  PAYMENT_SETTLED: 'PaymentSettled',
  EMERGENCY_RAISED: 'EmergencyRaised',
  DRIVER_FLAGGED: 'DriverFlagged',
  DRIVER_SUSPENDED: 'DriverSuspended',
  KYC_DOCUMENTS_SUBMITTED: 'KYCDocumentsSubmitted',
  KYC_DOCUMENTS_APPROVED: 'KYCDocumentsApproved',
  DELIVERY_PROOF_SUBMITTED: 'DeliveryProofSubmitted',
  REPUTATION_UPDATED: 'ReputationUpdated',
  POLICY_EVALUATED: 'PolicyEvaluated',
  NOTIFICATION_SENT: 'NotificationSent',
  SCHEDULED_TASK_CREATED: 'ScheduledTaskCreated',
  SCHEDULED_TASK_EXECUTED: 'ScheduledTaskExecuted',
  WEBHOOK_RECEIVED: 'WebhookReceived',
  WEBHOOK_PROCESSED: 'WebhookProcessed',
} as const;

export type EventName = typeof EVENT_NAMES[keyof typeof EVENT_NAMES];
`);

  file('packages/shared/domain-events/event-registry.ts', `import type { EventName } from './event-names';

export interface EventSchema {
  eventName: EventName;
  version: number;
  schema: Record<string, unknown>;
}

export interface EventRegistry {
  register(entry: EventSchema): void;
  getSchema(eventName: EventName): EventSchema | undefined;
  validate(eventName: EventName, payload: unknown): boolean;
}
`);

  file('packages/shared/domain-events/idempotent-event.ts', `import type { DomainEvent } from '@tos/shared/kernel';
import type { IdempotencyStore } from '@tos/shared/idempotency';

export async function isEventProcessed(
  store: IdempotencyStore,
  event: DomainEvent
): Promise<boolean> {
  const key = event.idempotencyKey ?? \`\${event.eventName}_\${event.aggregateId}_\${event.occurredAt}\`;
  return store.check(key);
}
`);

  file('packages/shared/domain-events/index.ts', `export type { EventBus, EventHandler } from './event-bus';
export type { EventStore } from './event-store';
export type { EventPublisher } from './event-publisher';
export { EVENT_NAMES, type EventName } from './event-names';
export type { EventSchema, EventRegistry } from './event-registry';
export { isEventProcessed } from './idempotent-event';
`);

  file('packages/shared/domain-events/README.md', `# Domain Events\n\nEventBus, EventStore, EventPublisher, EventRegistry.\n55 canonical event name constants.\nNaming convention: {Aggregate}{PastVerb} (e.g., JobCompleted, OfferSent).\n`);

  // utils
  file('packages/shared/utils/README.md', `# Utils\n\nGuardrail folder: only general-purpose, non-domain utilities.\n\n❌ No domain logic\n❌ No SDK wrappers\n❌ No "misc" dumping ground\n\n✅ Date formatting\n✅ String helpers\n✅ Array helpers\n`);

  // root barrel
  file('packages/shared/index.ts', `export * from './kernel';
export * from './contracts';
export * from './primitives';
export * from './result';
export * from './validation';
export * from './idempotency';
export * from './domain-events';
`);

  file('packages/shared/package.json', `{
  "name": "@tos/shared",
  "version": "0.1.0",
  "private": true,
  "main": "index.ts",
  "types": "index.ts"
}
`);
}

// ─────────────────────────────────────────────
// 6. CORE DOMAINS
// ─────────────────────────────────────────────
function genCoreDomains() {
  const domains = [
    {
      name: 'transport-job',
      desc: 'Unified transport job lifecycle (ride, delivery, courier, airport_pickup, vip, scheduled, emergency, rental, corporate, government, shuttle, fleet_task).',
      owns: 'Job aggregate, JobOffer, JobMetadata, JobEvent, status state machine.',
      notOwns: 'Driver data (identity), pricing calculation (pricing), driver matching (dispatch).',
      emits: ['JobCreated', 'JobStarted', 'JobCompleted', 'JobCancelled', 'OfferSent', 'OfferAccepted', 'OfferRejected', 'OfferExpired'],
      consumes: ['DriversRanked', 'PaymentAuthorized'],
      types: `export type JobType = 'ride' | 'delivery' | 'courier' | 'airport_pickup' | 'vip' | 'scheduled' | 'emergency' | 'rental' | 'corporate' | 'government' | 'shuttle' | 'fleet_task';
export type JobStatus = 'draft' | 'requested' | 'searching' | 'offered' | 'accepted' | 'driver_arrived' | 'in_progress' | 'completed' | 'cancelled' | 'failed' | 'expired';
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
export type JobId = string & { readonly __brand: 'JobId' };
export type OfferId = string & { readonly __brand: 'OfferId' };`,
      extraFiles: true,
    },
    {
      name: 'dispatch',
      desc: 'Matching available drivers to transport jobs, ranking candidates, managing offer flow.',
      owns: 'Dispatch aggregate, DriverCandidate, RankedDriver, offer retry logic.',
      notOwns: 'Driver data (identity), job lifecycle (transport-job), fare calculation (pricing).',
      emits: ['DispatchRequested', 'DriversRanked', 'OfferSent', 'OfferExpired'],
      consumes: ['JobCreated', 'OfferAccepted', 'OfferRejected'],
      types: `export type DispatchStrategy = 'nearest' | 'round_robin' | 'priority' | 'batch';
export type DispatchId = string & { readonly __brand: 'DispatchId' };
export interface DriverCandidate { driverId: string; distance: number; score: number; eta: number; }
export interface RankedDriver { driverId: string; rank: number; score: number; }`,
    },
    {
      name: 'pricing',
      desc: 'Fare calculation for all service types. Base fare, per-km, per-minute, surge, discounts, tolls, tips.',
      owns: 'FareEstimate, PricingBreakdown, SurgeZone, commission rules.',
      notOwns: 'Payment processing (financial), job lifecycle (transport-job).',
      emits: ['FareEstimated', 'SurgeLevelChanged'],
      consumes: [],
      types: `export interface PricingBreakdown { baseFare: bigint; perKmRate: bigint; perMinRate: bigint; distanceCharge: bigint; timeCharge: bigint; surgeMultiplier: number; discount: bigint; tolls: bigint; tip: bigint; total: bigint; currency: string; }
export interface FareEstimate { estimateId: string; breakdown: PricingBreakdown; validUntil: Date; }
export type SurgeLevel = 'normal' | 'moderate' | 'high' | 'extreme';`,
    },
    {
      name: 'scheduling',
      desc: 'Managing scheduled/recurring transport jobs, cron-based tasks, retry logic.',
      owns: 'ScheduledTask, TaskStatus, RetryPolicy, CronExpression.',
      notOwns: 'Job lifecycle (transport-job), dispatch logic (dispatch).',
      emits: ['ScheduledTaskCreated', 'ScheduledTaskExecuted', 'ScheduledTaskFailed'],
      consumes: ['JobCreated'],
      types: `export type TaskStatus = 'pending' | 'executing' | 'completed' | 'failed' | 'dead';
export type ScheduledTaskId = string & { readonly __brand: 'ScheduledTaskId' };
export interface RetryPolicy { maxRetries: number; backoffMs: number; backoffMultiplier: number; }
export interface CronExpression { expression: string; timezone: string; }`,
    },
    {
      name: 'identity',
      desc: 'User identity for all user types (driver, rider, operator, admin). Auth, profiles, phone verification, KYC.',
      owns: 'User aggregate, UserProfile, KYCStatus, KYCDocument.',
      notOwns: 'Capability grants (capability), safety flags (safety).',
      emits: ['UserRegistered', 'UserProfileUpdated', 'PhoneVerified', 'KYCDocumentsSubmitted', 'KYCDocumentsApproved', 'DriverApproved', 'DriverSuspended'],
      consumes: [],
      types: `export type UserRole = 'driver' | 'rider' | 'operator' | 'admin' | 'city_admin';
export type KYCStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';
export type UserId = string & { readonly __brand: 'UserId' };
export interface UserProfile { userId: string; displayName: string; phone: string; avatarUrl?: string; role: UserRole; }`,
    },
    {
      name: 'capability',
      desc: 'Fine-grained authorization for drivers. Grants/revokes capabilities based on city, vehicle type, service type.',
      owns: 'Capability aggregate, GrantScope, CapabilityConditions.',
      notOwns: 'User data (identity), policy evaluation (policy).',
      emits: ['CapabilityGranted', 'CapabilityRevoked', 'CapabilityExpired'],
      consumes: ['KYCDocumentsApproved', 'DriverSuspended'],
      types: `export type CapabilityType = 'city_access' | 'vehicle_type' | 'service_type' | 'time_restriction';
export interface GrantScope { cityId?: string; vehicleType?: string; serviceType?: string; }
export interface Condition { type: string; value: unknown; }`,
    },
    {
      name: 'safety',
      desc: 'Emergency handling, suspicious activity detection, driver flagging, safety case management.',
      owns: 'SafetyCase, Emergency, DriverFlag, Severity.',
      notOwns: 'User identity (identity), audit logging (audit).',
      emits: ['EmergencyRaised', 'DriverFlagged', 'SuspiciousActivityDetected', 'SafetyCaseEscalated', 'SafetyCaseResolved'],
      consumes: ['JobStarted', 'JobCompleted'],
      types: `export type SafetyCaseType = 'emergency' | 'suspicious_activity' | 'complaint' | 'accident';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type SafetyCaseId = string & { readonly __brand: 'SafetyCaseId' };
export type EmergencyType = 'medical' | 'accident' | 'crime' | 'breakdown';`,
    },
    {
      name: 'financial',
      desc: 'Transactions, commission calculation, driver wallet, settlements, refunds.',
      owns: 'Transaction, Commission, Settlement, DriverWallet.',
      notOwns: 'Payment gateway integration (infrastructure), pricing (pricing).',
      emits: ['PaymentAuthorized', 'PaymentCaptured', 'PaymentSettled', 'CommissionCalculated', 'RefundIssued'],
      consumes: ['JobCompleted', 'FareEstimated'],
      types: `export type TransactionType = 'charge' | 'commission' | 'payout' | 'refund' | 'adjustment';
export type TransactionStatus = 'pending' | 'authorized' | 'captured' | 'settled' | 'failed' | 'refunded';
export type TransactionId = string & { readonly __brand: 'TransactionId' };
export interface WalletEntry { id: string; amount: bigint; currency: string; type: 'credit' | 'debit' | 'hold' | 'release'; }`,
    },
    {
      name: 'audit',
      desc: 'Audit logging for all significant system actions. Event sourcing, compliance, investigation support.',
      owns: 'AuditEntry, AuditAction, AuditSubject.',
      notOwns: 'Safety investigations (safety), financial reconciliation (financial).',
      emits: ['AuditRecorded'],
      consumes: ['JobCreated', 'JobCompleted', 'PaymentSettled', 'EmergencyRaised', 'DriverFlagged'],
      types: `export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'payment' | 'emergency';
export interface AuditSubject { type: string; id: string; }
export interface AuditMetadata { ipAddress?: string; userAgent?: string; correlationId?: string; }`,
    },
    {
      name: 'notification',
      desc: 'Multi-channel notification delivery (push, SMS, email, in-app). Template management, delivery tracking.',
      owns: 'Notification, DeliveryStatus, Template, UserPreferences.',
      notOwns: 'In-app messaging (messaging), email infrastructure (infrastructure).',
      emits: ['NotificationSent', 'NotificationDelivered', 'NotificationFailed'],
      consumes: ['JobCreated', 'JobCompleted', 'OfferSent', 'EmergencyRaised'],
      types: `export type NotificationChannel = 'push' | 'sms' | 'email' | 'in_app';
export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
export interface NotificationTemplate { id: string; channel: NotificationChannel; subject: string; body: string; }`,
    },
    {
      name: 'messaging',
      desc: 'In-app chat/messaging between parties (rider-driver, rider-support). NOT system notifications.',
      owns: 'Conversation, Message, ReadReceipt.',
      notOwns: 'System notifications (notification), user identity (identity).',
      emits: ['MessageSent', 'MessageRead', 'ConversationCreated', 'ConversationClosed'],
      consumes: ['JobAccepted'],
      types: `export type MessageType = 'text' | 'image' | 'location' | 'system';
export type ConversationId = string & { readonly __brand: 'ConversationId' };
export type MessageId = string & { readonly __brand: 'MessageId' };
export interface ConversationParticipant { userId: string; role: string; joinedAt: Date; }`,
    },
    {
      name: 'geo',
      desc: 'Geographic services — service areas, geofencing, zone management, distance/time calculation.',
      owns: 'ServiceArea, Zone, Geofence, Route, Address.',
      notOwns: 'GeoPoint primitive (shared/kernel), pricing (pricing).',
      emits: ['ServiceAreaUpdated', 'ZoneEntered', 'ZoneExited', 'GeofenceTriggered'],
      consumes: [],
      types: `export type ServiceAreaId = string & { readonly __brand: 'ServiceAreaId' };
export type ZoneId = string & { readonly __brand: 'ZoneId' };
export interface Address { street: string; city: string; state: string; country: string; postalCode: string; geoPoint: { latitude: number; longitude: number }; }
export interface Route { distance: number; duration: number; polyline: string; }`,
    },
  ];

  for (const d of domains) {
    const base = `packages/domain/${d.name}`;
    const pName = pascal(d.name);

    // README
    file(`${base}/README.md`, `# ${pName} Domain

## Responsibility
${d.desc}

## What It Owns
${d.owns}

## What It Does NOT Own
${d.notOwns}

## Events Emitted
${d.emits.map(e => `- \`${e}\``).join('\n')}

## Events Consumed
${d.consumes.map(e => `- \`${e}\``).join('\n')}

## Architectural Constraints
- Domain never imports Infrastructure, SDKs, or process.env
- All external access through Ports
- Events for cross-domain communication
`);

    // index.ts
    file(`${base}/index.ts`, `// ${pName} Domain — barrel exports
export * from './types';
export * from './entities';
export * from './value-objects';
export * from './events';
export * from './errors';
export * from './ports';
`);

    // types.ts
    file(`${base}/types.ts`, d.types + '\n');

    // entities.ts
    file(`${base}/entities.ts`, `${DOMAIN_IMPORT}

// TODO: Implement domain entities extending AggregateRoot
// Example:
// export class ${pName}Aggregate extends AggregateRoot<${pName}Id> {
//   // properties and business methods
// }
`);

    // value-objects.ts
    file(`${base}/value-objects.ts`, `${DOMAIN_IMPORT}

// TODO: Implement domain-specific value objects extending ValueObject
`);

    // events.ts
    file(`${base}/events.ts`, `import type { DomainEvent } from '@tos/shared/kernel';

${d.emits.map(e => `export interface ${e}Event extends DomainEvent {
  eventName: '${e}';
  // TODO: define payload
  payload: Record<string, unknown>;
}`).join('\n\n')}
`);

    // commands.ts
    file(`${base}/commands.ts`, `// Command types — input DTOs for operations on this domain
// TODO: Define command types for each use case
`);

    // errors.ts
    file(`${base}/errors.ts`, `import { DomainError } from '@tos/shared/kernel';

export class ${pName}Error extends DomainError {
  domain = '${d.name}';
  constructor(public code: string, public message: string) { super(); }
}
`);

    // policies.ts
    file(`${base}/policies.ts`, `// Pluggable business rule policies
// TODO: Define policy interfaces and default implementations
`);

    // ports.ts
    file(`${base}/ports.ts`, `import type { Port } from '@tos/shared/contracts';

// TODO: Define port interfaces that infrastructure must implement
// Example:
// export interface SomeServicePort extends Port {
//   name: '${d.name}.some-service';
//   someMethod(input: unknown): Promise<unknown>;
// }
`);

    // repository.ts
    file(`${base}/repository.ts`, `import type { Repository } from '@tos/shared/contracts';

// TODO: Extend with domain-specific query methods
// export interface ${pName}Repository extends Repository<${pName}Entity, ${pName}Id> {
//   findByX(x: string): Promise<${pName}Entity[]>;
// }
`);

    // service.ts
    file(`${base}/service.ts`, `import type { Result } from '@tos/shared/result';

// Domain service — stateless operations spanning multiple entities
// export interface ${pName}Service {
//   someOperation(input: unknown): Promise<Result<unknown, unknown>>;
// }
`);

    // validators.ts
    file(`${base}/validators.ts`, `import type { Result } from '@tos/shared/result';

// Domain validation functions returning Result types
`);

    // constants.ts
    file(`${base}/constants.ts`, `// Domain constants — named, no magic numbers
export const ${d.name.replace(/-/g, '_').toUpperCase()}_DOMAIN = '${d.name}';
`);

    // __tests__
    file(`${base}/__tests__/domain-boundary.test.ts`, `/**
 * Domain Boundary Test
 * Verifies this domain only imports from:
 * - @tos/shared/kernel
 * - @tos/shared/primitives
 * - @tos/shared/contracts
 * - @tos/shared/result
 * - Itself (./)
 *
 * Must NOT import from:
 * - @tos/infrastructure
 * - @tos/application
 * - Any external SDK
 */

// TODO: implement boundary verification
describe('${pName} domain boundary', () => {
  it('should only import from allowed packages', () => {
    // Verify import graph
  });
});
`);

    // Extra files for transport-job
    if (d.extraFiles) {
      file(`${base}/transport-job.entity.ts`, `import { AggregateRoot } from '@tos/shared/kernel';
import type { JobId, JobType, JobStatus } from './types';

export class TransportJob extends AggregateRoot<JobId> {
  private _type: JobType;
  private _status: JobStatus;
  private _riderId: string;
  private _driverId?: string;
  private _origin: { latitude: number; longitude: number };
  private _destination: { latitude: number; longitude: number };
  private _metadata: Record<string, unknown>;

  constructor(id: JobId, type: JobType, riderId: string, origin: any, destination: any) {
    super(id);
    this._type = type;
    this._status = 'draft';
    this._riderId = riderId;
    this._origin = origin;
    this._destination = destination;
    this._metadata = {};
  }

  get type(): JobType { return this._type; }
  get status(): JobStatus { return this._status; }
  get riderId(): string { return this._riderId; }
  get driverId(): string | undefined { return this._driverId; }
  get origin() { return this._origin; }
  get destination() { return this._destination; }

  // TODO: Implement status transition methods
  // request(), search(), assignDriver(), start(), complete(), cancel()
}
`);

      file(`${base}/job-offer.entity.ts`, `import { Entity } from '@tos/shared/kernel';
import type { OfferId, OfferStatus } from './types';

export class JobOffer extends Entity<OfferId> {
  private _jobId: string;
  private _driverId: string;
  private _status: OfferStatus;
  private _price: bigint;
  private _expiresAt: Date;
  private _respondedAt?: Date;

  constructor(id: OfferId, jobId: string, driverId: string, price: bigint, expiresAt: Date) {
    super(id);
    this._jobId = jobId;
    this._driverId = driverId;
    this._status = 'pending';
    this._price = price;
    this._expiresAt = expiresAt;
  }

  get jobId(): string { return this._jobId; }
  get driverId(): string { return this._driverId; }
  get status(): OfferStatus { return this._status; }
  get price(): bigint { return this._price; }
  get expiresAt(): Date { return this._expiresAt; }

  // TODO: accept(), reject(), expire()
}
`);

      file(`${base}/job-event.entity.ts`, `import type { DomainEvent } from '@tos/shared/kernel';

export interface JobEvent extends DomainEvent {
  jobId: string;
  // Event sourcing record for a single job state change
}
`);

      file(`${base}/job-metadata.schemas.ts`, `// Metadata validation schemas per job type.
// Each job.type has a specific metadata shape.
// TODO: Implement Zod schemas for each type.

export interface RideMetadata {
  passengerCount: number;
  vehiclePreference?: 'sedan' | 'suv' | 'hatchback';
}

export interface DeliveryMetadata {
  packageWeight: number;
  packageDimensions: { length: number; width: number; height: number };
  recipientPhone: string;
  isfragile: boolean;
}

export interface CourierMetadata {
  stops: Array<{ address: string; action: 'pickup' | 'dropoff'; contactPhone: string }>;
  totalWeight: number;
}

export interface AirportPickupMetadata {
  flightNumber: string;
  arrivalTime: string;
  terminal: string;
  meetAndGreet: boolean;
}

export interface VIPMetadata {
  vehicleClass: 'luxury' | 'premium' | 'executive';
  specialRequests?: string[];
}

export interface ScheduledMetadata {
  scheduledAt: string;
  recurrence?: 'daily' | 'weekly' | 'none';
  notifyBefore: number; // minutes
}

export interface EmergencyMetadata {
  emergencyType: 'medical' | 'accident' | 'crime' | 'breakdown';
  description: string;
  contactAuthorities: boolean;
}
`);

      file(`${base}/job-status-machine.ts`, `import type { JobType, JobStatus } from './types';

type TransitionMap = Record<JobStatus, JobStatus[]>;

const rideTransitions: TransitionMap = {
  draft: ['requested'],
  requested: ['searching', 'cancelled'],
  searching: ['offered', 'cancelled', 'failed'],
  offered: ['accepted', 'expired', 'cancelled'],
  accepted: ['driver_arrived', 'cancelled'],
  driver_arrived: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled', 'failed'],
  completed: [],
  cancelled: [],
  failed: [],
  expired: [],
};

const deliveryTransitions: TransitionMap = {
  ...rideTransitions,
  in_progress: ['completed', 'cancelled', 'failed'],
  // TODO: add proof_submitted, confirmed states
};

const scheduledTransitions: TransitionMap = {
  draft: ['requested'],
  requested: ['searching'],
  searching: ['offered', 'failed'],
  offered: ['accepted', 'expired'],
  accepted: ['driver_arrived'],
  driver_arrived: ['in_progress'],
  in_progress: ['completed', 'failed'],
  completed: [],
  cancelled: [],
  failed: [],
  expired: [],
};

const transitionMaps: Record<JobType, TransitionMap> = {
  ride: rideTransitions,
  delivery: deliveryTransitions,
  courier: deliveryTransitions,
  airport_pickup: rideTransitions,
  vip: rideTransitions,
  scheduled: scheduledTransitions,
  emergency: { ...rideTransitions, requested: ['searching', 'cancelled'], searching: ['offered', 'failed'] },
  rental: rideTransitions,
  corporate: rideTransitions,
  government: rideTransitions,
  shuttle: rideTransitions,
  fleet_task: scheduledTransitions,
};

export function canTransition(type: JobType, from: JobStatus, to: JobStatus): boolean {
  return transitionMaps[type]?.[from]?.includes(to) ?? false;
}
`);

      file(`${base}/job-transitions.ts`, `import { canTransition } from './job-status-machine';
import type { JobStatus, JobType } from './types';

export function validateTransition(type: JobType, from: JobStatus, to: JobStatus): boolean {
  return canTransition(type, from, to);
}

// TODO: Implement transition side effects
// export function requestJob(job: TransportJob): void { ... }
// export function searchDrivers(job: TransportJob): void { ... }
// export function sendOffer(job: TransportJob, driverId: string): void { ... }
// export function acceptOffer(job: TransportJob, offerId: string): void { ... }
// export function startJob(job: TransportJob): void { ... }
// export function completeJob(job: TransportJob): void { ... }
// export function cancelJob(job: TransportJob, reason: string): void { ... }
`);
    }
  }
}

// ─────────────────────────────────────────────
// 7. PLANNED DOMAINS
// ─────────────────────────────────────────────
function genPlannedDomains() {
  const planned = [
    { name: 'delivery', desc: 'Proof of delivery, OTP confirmation, package tracking.', merged: false },
    { name: 'reputation', desc: 'Trust scores, ratings, reviews.', merged: false },
    { name: 'policy', desc: 'Externalized business rule evaluation engine.', merged: false },
    { name: 'workflow', desc: 'Declarative state machine definitions and transition validation.', merged: false },
    { name: 'service-registry', desc: 'Service definitions driving dispatch and pricing.', merged: false },
    { name: 'feature-flags', desc: 'Feature enable/disable with city/percentage rollout.', merged: false },
    { name: 'operations-intelligence', desc: 'Operational insights, KPIs, anomaly detection.', merged: false },
    { name: 'support', desc: 'Customer support tickets, escalation workflows.', merged: false },
    { name: 'emergency', desc: 'Emergency response coordination. Merged into safety domain.', merged: true },
    { name: 'documents', desc: 'Document storage, versioning, access control.', merged: false },
    { name: 'kyc', desc: 'KYC verification workflows. Merged into identity domain.', merged: true },
  ];

  for (const d of planned) {
    const base = `packages/domain/${d.name}`;
    const pName = pascal(d.name);

    file(`${base}/README.md`, `# ${pName} Domain (Planned)

## Responsibility
${d.desc}
${d.merged ? '\n> **Note:** This domain is merged into its parent domain. This directory exists for future extraction.\n' : ''}

## Status: Planned
Contracts only. Full implementation deferred.
`);

    file(`${base}/index.ts`, `// ${pName} Domain — planned (contracts only)
export * from './types';
`);

    file(`${base}/types.ts`, `// ${pName} domain types — placeholder
export type ${pName}Id = string & { readonly __brand: '${pName}Id' };
`);

    file(`${base}/events.ts`, `import type { DomainEvent } from '@tos/shared/kernel';
// ${pName} domain events — placeholder
`);

    file(`${base}/ports.ts`, `import type { Port } from '@tos/shared/contracts';
// ${pName} domain ports — placeholder
`);
  }

  // YAML definitions
  file('packages/domain/workflow/definitions/ride.workflow.yaml', `workflow:
  name: ride
  version: "1.0"
  description: "Ride request lifecycle state machine"
  initial_state: draft
  states:
    - name: draft
      transitions: [requested]
    - name: requested
      transitions: [searching, cancelled]
    - name: searching
      transitions: [offered, cancelled, failed]
    - name: offered
      transitions: [accepted, expired, cancelled]
    - name: accepted
      transitions: [driver_arrived, cancelled]
    - name: driver_arrived
      transitions: [in_progress, cancelled]
    - name: in_progress
      transitions: [completed, cancelled, failed]
    - name: completed
      terminal: true
    - name: cancelled
      terminal: true
    - name: failed
      terminal: true
    - name: expired
      terminal: true
`);

  file('packages/domain/workflow/definitions/delivery.workflow.yaml', `workflow:
  name: delivery
  version: "1.0"
  description: "Delivery lifecycle with proof and OTP"
  initial_state: draft
  states:
    - name: draft
      transitions: [requested]
    - name: requested
      transitions: [searching, cancelled]
    - name: searching
      transitions: [offered, cancelled, failed]
    - name: offered
      transitions: [accepted, expired, cancelled]
    - name: accepted
      transitions: [driver_arrived, cancelled]
    - name: driver_arrived
      transitions: [in_progress, cancelled]
    - name: in_progress
      transitions: [proof_submitted, cancelled, failed]
    - name: proof_submitted
      transitions: [confirmed, failed]
    - name: confirmed
      terminal: true
    - name: cancelled
      terminal: true
    - name: failed
      terminal: true
    - name: expired
      terminal: true
`);

  file('packages/domain/workflow/definitions/courier.workflow.yaml', `workflow:
  name: courier
  version: "1.0"
  description: "Courier multi-stop lifecycle"
  initial_state: draft
  states:
    - name: draft
      transitions: [requested]
    - name: requested
      transitions: [searching, cancelled]
    - name: searching
      transitions: [offered, failed]
    - name: offered
      transitions: [accepted, expired]
    - name: accepted
      transitions: [en_route_pickup, cancelled]
    - name: en_route_pickup
      transitions: [at_pickup, cancelled]
    - name: at_pickup
      transitions: [picked_up, cancelled]
    - name: picked_up
      transitions: [en_route_dropoff, cancelled]
    - name: en_route_dropoff
      transitions: [at_dropoff, failed]
    - name: at_dropoff
      transitions: [delivered, failed]
    - name: delivered
      terminal: true
    - name: cancelled
      terminal: true
    - name: failed
      terminal: true
`);

  file('packages/domain/workflow/definitions/scheduled.workflow.yaml', `workflow:
  name: scheduled
  version: "1.0"
  description: "Scheduled job lifecycle with retry"
  initial_state: scheduled
  states:
    - name: scheduled
      transitions: [triggered, cancelled]
    - name: triggered
      transitions: [dispatched, retrying, failed]
    - name: dispatched
      transitions: [accepted, expired, retrying]
    - name: retrying
      transitions: [triggered, dead]
    - name: accepted
      transitions: [completed, failed]
    - name: completed
      terminal: true
    - name: cancelled
      terminal: true
    - name: expired
      terminal: true
    - name: failed
      terminal: true
    - name: dead
      terminal: true
`);

  file('packages/domain/policy/policies/default.policy.yaml', `policies:
  - name: driver_eligibility
    version: "1.0"
    rules:
      - condition: "driver.kyc_status == 'approved'"
        effect: allow
      - condition: "driver.suspended == true"
        effect: deny
        reason: "Driver is suspended"

  - name: cancellation_fee
    version: "1.0"
    rules:
      - condition: "job.status == 'accepted' AND elapsed_minutes > 5"
        effect: modify
        modification: { apply_cancellation_fee: true }
      - condition: "job.status == 'searching'"
        effect: allow
        modification: { apply_cancellation_fee: false }
`);

  file('packages/domain/policy/policies/city.policy.example.yaml', `# City-specific policy overrides
policies:
  - name: city_surge_cap
    city_id: city_example
    rules:
      - condition: "surge.multiplier > 2.5"
        effect: modify
        modification: { surge_multiplier: 2.5 }
`);

  file('packages/domain/policy/policies/delivery.policy.example.yaml', `# Delivery-specific policies
policies:
  - name: proof_requirements
    rules:
      - condition: "job.type == 'delivery' AND city.requires_otp"
        effect: modify
        modification: { require_otp: true }
`);

  file('packages/domain/service-registry/services/ride.service.yaml', `service:
  service_id: ride
  name: "Standard Ride"
  enabled: true
  job_type: ride
  required_capabilities:
    - type: city_access
      scope: "{city_id}"
    - type: vehicle_type
      scope: "sedan|suv|hatchback"
  supports_scheduling: true
  supports_payment: true
  supports_proof: false
  supports_otp: false
  max_passengers: 4
  allowed_cities: ["*"]
`);

  file('packages/domain/service-registry/services/delivery.service.yaml', `service:
  service_id: delivery
  name: "Package Delivery"
  enabled: true
  job_type: delivery
  required_capabilities:
    - type: city_access
      scope: "{city_id}"
  supports_scheduling: true
  supports_payment: true
  supports_proof: true
  supports_otp: true
  max_weight_kg: 20
  allowed_cities: ["*"]
`);

  file('packages/domain/service-registry/services/courier.service.yaml', `service:
  service_id: courier
  name: "Multi-Stop Courier"
  enabled: true
  job_type: courier
  required_capabilities:
    - type: city_access
      scope: "{city_id}"
  supports_scheduling: false
  supports_payment: true
  supports_proof: true
  supports_otp: false
  max_stops: 10
  max_weight_kg: 30
  allowed_cities: ["*"]
`);

  file('packages/domain/service-registry/services/vip.service.yaml', `service:
  service_id: vip
  name: "VIP Premium Ride"
  enabled: true
  job_type: vip
  required_capabilities:
    - type: city_access
      scope: "{city_id}"
    - type: vehicle_type
      scope: "luxury|premium|executive"
  required_driver_attributes:
    - min_trust_score: 70
    - min_completed_jobs: 100
  supports_scheduling: true
  supports_payment: true
  allowed_cities: ["city_001", "city_002"]
`);

  file('packages/domain/service-registry/services/airport-pickup.service.yaml', `service:
  service_id: airport_pickup
  name: "Airport Pickup"
  enabled: true
  job_type: airport_pickup
  required_capabilities:
    - type: city_access
      scope: "{city_id}"
    - type: service_type
      scope: "airport"
  supports_scheduling: true
  supports_payment: true
  features: [flight_tracking, meet_and_greet, waiting_time]
  free_waiting_minutes: 30
  allowed_cities: ["*"]
`);

  file('packages/domain/feature-flags/flags/delivery.flag.yaml', `flag:
  name: delivery_enabled
  description: "Enable delivery service type"
  default: false
  rollout_rules:
    - type: city
      cities: ["city_001", "city_002"]
      enabled: true
    - type: percentage
      percentage: 50
      seed: delivery_rollout
`);

  file('packages/domain/feature-flags/flags/vip.flag.yaml', `flag:
  name: vip_enabled
  description: "Enable VIP premium service"
  default: false
  rollout_rules:
    - type: city
      cities: ["city_001"]
      enabled: true
`);

  file('packages/domain/feature-flags/flags/mini-apps.flag.yaml', `flag:
  name: mini_apps_enabled
  description: "Enable Telegram Mini Apps"
  default: false
  rollout_rules:
    - type: percentage
      percentage: 10
      seed: mini_apps_rollout
`);
}

// ─────────────────────────────────────────────
// 8. APPLICATION LAYER
// ─────────────────────────────────────────────
function genApplicationLayer() {
  const useCases = [
    // transport
    { group: 'transport', name: 'request-job', desc: 'Create a new transport job', ports: 'TransportJobRepository, ServiceRegistry, GeoPort' },
    { group: 'transport', name: 'request-ride', desc: 'Specialized ride request', ports: 'TransportJobRepository, PricingPort' },
    { group: 'transport', name: 'request-delivery', desc: 'Specialized delivery request', ports: 'TransportJobRepository' },
    { group: 'transport', name: 'accept-offer', desc: 'Driver accepts a job offer', ports: 'JobOfferRepository, TransportJobRepository' },
    { group: 'transport', name: 'reject-offer', desc: 'Driver rejects a job offer', ports: 'JobOfferRepository' },
    { group: 'transport', name: 'expire-offer', desc: 'System expires an offer after timeout', ports: 'JobOfferRepository, DispatchService' },
    { group: 'transport', name: 'start-job', desc: 'Job transitions to in_progress', ports: 'TransportJobRepository' },
    { group: 'transport', name: 'complete-job', desc: 'Job completed successfully', ports: 'TransportJobRepository, FinancialService' },
    { group: 'transport', name: 'cancel-job', desc: 'Cancel a job', ports: 'TransportJobRepository, FinancialService' },
    { group: 'transport', name: 'schedule-job', desc: 'Schedule a future job', ports: 'SchedulingService' },
    { group: 'transport', name: 'retry-dispatch', desc: 'Retry dispatch after failure', ports: 'DispatchService' },
    // driver
    { group: 'driver', name: 'register-driver', desc: 'Register a new driver', ports: 'IdentityRepository, CapabilityService' },
    { group: 'driver', name: 'update-driver-location', desc: 'Update driver location', ports: 'DriverLocationStore' },
    { group: 'driver', name: 'set-driver-availability', desc: 'Toggle driver online/offline', ports: 'DriverRepository' },
    { group: 'driver', name: 'submit-driver-kyc', desc: 'Submit KYC documents', ports: 'IdentityService, StoragePort' },
    { group: 'driver', name: 'approve-driver', desc: 'Admin approves driver', ports: 'IdentityRepository, CapabilityService' },
    { group: 'driver', name: 'suspend-driver', desc: 'Suspend a driver', ports: 'IdentityRepository, CapabilityService' },
    // rider
    { group: 'rider', name: 'register-rider', desc: 'Register a new rider', ports: 'IdentityRepository' },
    { group: 'rider', name: 'update-rider-profile', desc: 'Update rider profile', ports: 'IdentityRepository' },
    // delivery
    { group: 'delivery', name: 'request-delivery', desc: 'Create a delivery job', ports: 'TransportJobRepository' },
    { group: 'delivery', name: 'submit-delivery-proof', desc: 'Submit proof of delivery', ports: 'DeliveryService, StoragePort' },
    { group: 'delivery', name: 'confirm-delivery-otp', desc: 'Recipient confirms with OTP', ports: 'DeliveryService' },
    // financial
    { group: 'financial', name: 'calculate-commission', desc: 'Calculate platform commission', ports: 'FinancialRepository' },
    { group: 'financial', name: 'create-transaction', desc: 'Create a financial transaction', ports: 'FinancialRepository, PaymentGateway' },
    { group: 'financial', name: 'settle-driver-wallet', desc: 'Settle driver earnings', ports: 'DriverWalletRepository, PaymentGateway' },
    { group: 'financial', name: 'refund-payment', desc: 'Process a refund', ports: 'FinancialRepository, PaymentGateway' },
    // identity
    { group: 'identity', name: 'link-telegram-account', desc: 'Link Telegram chatId to user', ports: 'IdentityRepository' },
    { group: 'identity', name: 'verify-phone', desc: 'Send and verify phone OTP', ports: 'IdentityRepository, NotificationService' },
    { group: 'identity', name: 'submit-kyc-documents', desc: 'Submit identity verification docs', ports: 'IdentityRepository, StoragePort' },
    // safety
    { group: 'safety', name: 'raise-emergency', desc: 'Trigger an emergency', ports: 'SafetyRepository, NotificationService, GeoPort' },
    { group: 'safety', name: 'flag-suspicious-activity', desc: 'Flag suspicious behavior', ports: 'SafetyRepository' },
    { group: 'safety', name: 'escalate-safety-case', desc: 'Escalate a safety case', ports: 'SafetyRepository, NotificationService' },
    // capability
    { group: 'capability', name: 'grant-capability', desc: 'Grant a capability to a user', ports: 'CapabilityRepository, PolicyPort' },
    { group: 'capability', name: 'revoke-capability', desc: 'Revoke a capability', ports: 'CapabilityRepository' },
    { group: 'capability', name: 'check-capability', desc: 'Check if user has capability', ports: 'CapabilityRepository' },
    // scheduling
    { group: 'scheduling', name: 'create-scheduled-task', desc: 'Create a scheduled task', ports: 'SchedulingRepository' },
    { group: 'scheduling', name: 'execute-due-task', desc: 'Execute a task that is due', ports: 'SchedulingRepository' },
    { group: 'scheduling', name: 'retry-failed-task', desc: 'Retry a failed task', ports: 'SchedulingRepository' },
    // workflow
    { group: 'workflow', name: 'validate-transition', desc: 'Validate state transition', ports: 'WorkflowEngine' },
    { group: 'workflow', name: 'execute-transition', desc: 'Execute validated transition', ports: 'WorkflowEngine, EventPublisher' },
    // reputation
    { group: 'reputation', name: 'update-trust-score', desc: 'Recalculate trust score', ports: 'ReputationRepository, TransportJobPort, SafetyPort' },
    // policy
    { group: 'policy', name: 'evaluate-policy', desc: 'Evaluate a policy against context', ports: 'PolicyEngine' },
    // notification
    { group: 'notification', name: 'send-notification', desc: 'Send a notification', ports: 'NotificationRepository' },
    // messaging
    { group: 'messaging', name: 'send-message', desc: 'Send a message in a conversation', ports: 'MessagingRepository, NotificationPort' },
  ];

  for (const uc of useCases) {
    const base = `packages/application/${uc.group}/${uc.name}`;
    const pName = pascal(uc.name);

    file(`${base}/README.md`, `# ${pName}\n\n${uc.desc}.\n\n## Required Ports\n${uc.ports.split(', ').map(p => `- \`${p}\``).join('\n')}\n`);

    file(`${base}/input.ts`, `// Input DTO for ${pName}
export interface ${pName}Input {
  // TODO: define input fields
  [key: string]: unknown;
}
`);

    file(`${base}/output.ts`, `import type { Result } from '@tos/shared/result';

// Output DTO for ${pName}
export interface ${pName}Output {
  // TODO: define output fields
  [key: string]: unknown;
}

export type ${pName}Result = Result<${pName}Output, Error>;
`);

    file(`${base}/errors.ts`, `import { DomainError } from '@tos/shared/kernel';

export class ${pName}Error extends DomainError {
  domain = '${uc.group}';
  constructor(public code: string, public message: string) { super(); }
}
`);

    file(`${base}/handler.ts`, `import type { ${pName}Input } from './input';
import type { ${pName}Result } from './output';

/**
 * ${pName} Use Case Handler
 *
 * Description: ${uc.desc}
 * Required ports: ${uc.ports}
 *
 * Flow:
 * 1. Validate input
 * 2. Call domain services/repositories via ports
 * 3. Return Result<Output, Error>
 */
export class ${pName}Handler {
  // TODO: Inject ports via constructor
  // constructor(
  //   private readonly repository: SomeRepository,
  //   private readonly service: SomeService,
  // ) {}

  async execute(input: ${pName}Input): Promise<${pName}Result> {
    // Step 1: Validate input
    // Step 2: Call domain operations
    // Step 3: Return result
    throw new Error('Not implemented');
  }
}
`);

    file(`${base}/index.ts`, `export { ${pName}Handler } from './handler';
export type { ${pName}Input } from './input';
export type { ${pName}Output, ${pName}Result } from './output';
export { ${pName}Error } from './errors';
`);

    file(`${base}/__tests__/contract.test.ts`, `/**
 * Contract test for ${pName}
 * Verifies input/output types and handler behavior.
 */

describe('${pName}', () => {
  it('should define input/output contracts correctly', () => {
    // TODO: implement contract tests
  });
});
`);
  }
}

// ─────────────────────────────────────────────
// 9. INFRASTRUCTURE
// ─────────────────────────────────────────────
function genInfrastructure() {
  const infra = {
    'database/migrations': { files: { 'README.md': `# Database Migrations\n\nSequential numbered migrations. Run via migration-runner.\n` } },
    'supabase': {
      files: {
        'client.ts': `/** Supabase client factory. Only used by infrastructure adapters. */\nexport function createSupabaseClient(url: string, key: string) {\n  throw new Error('Not implemented — requires @supabase/supabase-js');\n}\n`,
        'admin-client.ts': `/** Admin client with service role key for bypassing RLS. */\nexport function createAdminClient(url: string, serviceKey: string) {\n  throw new Error('Not implemented');\n}\n`,
        'auth.ts': `/** Auth adapter implementing the Identity AuthPort using Supabase Auth. */\nexport class SupabaseAuthAdapter {\n  // TODO: implement\n}\n`,
        'storage.ts': `/** Storage adapter implementing StoragePort using Supabase Storage. */\nexport class SupabaseStorageAdapter {\n  // TODO: implement\n}\n`,
        'README.md': `# Supabase Infrastructure\n\nClient factories, auth adapter, storage adapter, RLS policies.\n`,
        'rls/README.md': `# Row Level Security\n\nOwner-based, city-operator, admin policies.\n`,
      }
    },
    'telegram': {
      files: {
        'telegram-client.ts': `export interface SendMessageOptions { chatId: string | number; text: string; parseMode?: 'HTML' | 'Markdown'; replyMarkup?: Record<string, unknown>; }\nexport class TelegramClient {\n  constructor(private readonly botToken: string) {}\n  async sendMessage(opts: SendMessageOptions) { throw new Error('Not implemented'); }\n}\n`,
        'webhook-verifier.ts': `export function verifyTelegramWebhook(token: string, body: string, secret: string): boolean {\n  throw new Error('Not implemented');\n}\n`,
        'message-sender.ts': `export class MessageSender {\n  async sendTextWithKeyboard(chatId: string, text: string, buttons: any[]) { throw new Error('Not implemented'); }\n  async sendJobCard(chatId: string, job: any) { throw new Error('Not implemented'); }\n}\n`,
        'keyboard-builder.ts': `export class InlineKeyboardBuilder {\n  private rows: any[][] = [];\n  addButton(text: string, data: string) { return this; }\n  addRow() { return this; }\n  build() { return { inline_keyboard: this.rows }; }\n}\n`,
        'README.md': `# Telegram Infrastructure\n\nBot client, webhook verification, keyboard builder.\n`,
      }
    },
    'maps': {
      files: {
        'route-calculator.ts': `export class RouteCalculator {\n  async calculateRoute(from: any, to: any) { throw new Error('Not implemented'); }\n  async estimateDuration(from: any, to: any) { throw new Error('Not implemented'); }\n}\n`,
        'geocoder.ts': `export class Geocoder {\n  async geocode(address: string) { throw new Error('Not implemented'); }\n  async reverseGeocode(lat: number, lng: number) { throw new Error('Not implemented'); }\n}\n`,
        'README.md': `# Maps Infrastructure\n\nRoute calculation, geocoding, distance matrix.\n`,
      }
    },
    'payment': {
      files: {
        'stripe-client.ts': `export class StripeClient {\n  constructor(private readonly secretKey: string) {}\n  async createPaymentIntent(amount: number, currency: string) { throw new Error('Not implemented'); }\n  async capturePayment(intentId: string) { throw new Error('Not implemented'); }\n  async createRefund(paymentId: string, amount?: number) { throw new Error('Not implemented'); }\n}\n`,
        'webhook-handler.ts': `export function verifyStripeSignature(payload: string, sig: string, secret: string): boolean {\n  throw new Error('Not implemented');\n}\n`,
        'README.md': `# Payment Infrastructure\n\nStripe integration for payments, refunds, webhooks.\n`,
      }
    },
    'messaging': {
      files: {
        'push-provider.ts': `export class PushProvider {\n  async sendPush(token: string, title: string, body: string) { throw new Error('Not implemented'); }\n}\n`,
        'sms-provider.ts': `export class SMSProvider {\n  async sendSMS(phone: string, message: string) { throw new Error('Not implemented'); }\n}\n`,
        'email-provider.ts': `export class EmailProvider {\n  async sendEmail(to: string, subject: string, html: string) { throw new Error('Not implemented'); }\n}\n`,
        'README.md': `# Messaging Infrastructure\n\nPush (FCM), SMS (Twilio), Email (SendGrid) providers.\n`,
      }
    },
    'events': {
      files: {
        'in-memory-event-bus.ts': `import type { DomainEvent } from '@tos/shared/kernel';\nexport class InMemoryEventBus {\n  private handlers = new Map<string, Function[]>();\n  async publish(event: DomainEvent) { /* TODO */ }\n  subscribe(name: string, handler: Function) { /* TODO */ }\n}\n`,
        'supabase-event-store.ts': `export class SupabaseEventStore {\n  async append(event: any) { throw new Error('Not implemented'); }\n  async getEvents(aggregateId: string) { throw new Error('Not implemented'); }\n}\n`,
        'README.md': `# Event Infrastructure\n\nIn-memory event bus (dev), Supabase event store.\n`,
      }
    },
    'queue': {
      files: {
        'task-queue.ts': `export class TaskQueue {\n  async enqueue(task: string, payload: any, delay?: number) { throw new Error('Not implemented'); }\n  async getTask(id: string) { throw new Error('Not implemented'); }\n}\n`,
        'README.md': `# Task Queue\n\nBackground job queue with retries and dead letter.\n`,
      }
    },
    'cache': {
      files: {
        'cache-store.ts': `export class CacheStore {\n  async get(key: string) { throw new Error('Not implemented'); }\n  async set(key: string, value: any, ttl?: number) { throw new Error('Not implemented'); }\n  async delete(key: string) { throw new Error('Not implemented'); }\n}\n`,
        'README.md': `# Cache Infrastructure\n\nIn-memory + Redis cache with TTL.\n`,
      }
    },
    'logging': {
      files: {
        'logger.ts': `export class Logger {\n  constructor(private readonly context: string) {}\n  info(message: string, meta?: any) { console.log(JSON.stringify({ level: 'info', context: this.context, message, ...meta })); }\n  warn(message: string, meta?: any) { console.warn(JSON.stringify({ level: 'warn', context: this.context, message, ...meta })); }\n  error(message: string, meta?: any) { console.error(JSON.stringify({ level: 'error', context: this.context, message, ...meta })); }\n  debug(message: string, meta?: any) { console.debug(JSON.stringify({ level: 'debug', context: this.context, message, ...meta })); }\n}\n`,
        'README.md': `# Logging Infrastructure\n\nStructured JSON logger with correlation context.\n`,
      }
    },
  };

  for (const [subdir, config] of Object.entries(infra)) {
    for (const [filename, content] of Object.entries(config.files)) {
      file(`packages/infrastructure/${subdir}/${filename}`, content);
    }
  }

  file('packages/infrastructure/index.ts', `// Infrastructure barrel exports\nexport {};\n`);
}

// ─────────────────────────────────────────────
// 10. CONFIG / DATABASE / TESTING / OBSERVABILITY
// ─────────────────────────────────────────────
function genSupportPackages() {
  // config
  file('packages/config/index.ts', `export { loadConfig, type AppConfig } from './config';\n`);
  file('packages/config/config.ts', `export interface AppConfig { env: string; port: number; }\nexport function loadConfig(): AppConfig {\n  return { env: process.env.NODE_ENV ?? 'development', port: Number(process.env.PORT ?? 3000) };\n}\n`);
  file('packages/config/README.md', `# Config\n\nTHE ONLY package that reads process.env. Validates via Zod schemas.\n`);

  // database
  file('packages/database/index.ts', `export {};\n`);
  file('packages/database/migration-runner.ts', `export class MigrationRunner {\n  async runMigrations() { throw new Error('Not implemented'); }\n  async rollback(steps: number) { throw new Error('Not implemented'); }\n}\n`);
  file('packages/database/connection.ts', `export class ConnectionPool {\n  constructor(private readonly connectionString: string) {}\n  async getConnection() { throw new Error('Not implemented'); }\n}\n`);
  file('packages/database/README.md', `# Database\n\nMigration runner, connection pool management.\n`);

  // testing
  file('packages/testing/index.ts', `export {};\n`);
  file('packages/testing/test-helpers.ts', `import { randomUUID } from 'crypto';\nexport function createTestId(prefix?: string) { return prefix ? \`\${prefix}_\${randomUUID()}\` : randomUUID(); }\nexport function createTestDate() { return new Date('2026-01-01T00:00:00Z'); }\n`);
  file('packages/testing/mocks.ts', `export class MockRepository {\n  private store = new Map();\n  async findById(id: string) { return this.store.get(id) ?? null; }\n  async save(entity: any) { this.store.set(entity.id, entity); }\n  async delete(id: string) { this.store.delete(id); }\n}\n`);
  file('packages/testing/fixtures.ts', `export function createTestDriver() { return { id: 'driver_test', name: 'Test Driver', role: 'driver' };\n}\nexport function createTestRider() { return { id: 'rider_test', name: 'Test Rider', role: 'rider' };\n}\nexport function createTestJob() { return { id: 'job_test', type: 'ride', status: 'requested' };\n}\n`);
  file('packages/testing/README.md', `# Testing\n\nTest helpers, mocks, fixtures.\n`);

  // observability
  file('packages/observability/index.ts', `export {};\n`);
  file('packages/observability/tracing.ts', `export function withCorrelation<T>(correlationId: string, fn: () => Promise<T>): Promise<T> { return fn(); }\n`);
  file('packages/observability/metrics.ts', `export class Metrics {\n  increment(name: string, labels?: Record<string, string>) { /* TODO */ }\n  gauge(name: string, value: number, labels?: Record<string, string>) { /* TODO */ }\n  histogram(name: string, value: number, labels?: Record<string, string>) { /* TODO */ }\n}\n`);
  file('packages/observability/README.md', `# Observability\n\nTracing, metrics, logging.\n`);
}

// ─────────────────────────────────────────────
// 11. APPS
// ─────────────────────────────────────────────
function genApps() {
  const apps = [
    { name: 'telegram-rider-bot', desc: 'Telegram bot for riders. Commands: /start, /ride, /cancel, /status, /help.' },
    { name: 'telegram-driver-bot', desc: 'Telegram bot for drivers. Commands: /start, /online, /offline, /accept, /reject, /arrived, /complete.' },
    { name: 'telegram-delivery-bot', desc: 'Telegram bot for delivery senders and recipients.' },
    { name: 'city-bot', desc: 'City-level Telegram bot for operators. /stats, /drivers, /pending, /escalations.' },
    { name: 'admin-dashboard', desc: 'Web dashboard for system admins. User management, config, analytics.' },
    { name: 'city-operator-dashboard', desc: 'Web dashboard for city operators. City management, reports.' },
    { name: 'rider-mini-app', desc: 'Telegram Mini App for riders. Map, booking, history.' },
    { name: 'driver-mini-app', desc: 'Telegram Mini App for drivers. Map, earnings, availability.' },
    { name: 'delivery-mini-app', desc: 'Telegram Mini App for delivery tracking.' },
    { name: 'public-api', desc: 'REST API for third-party integrations. Rate limiting, API keys.' },
    { name: 'worker', desc: 'Background worker for async tasks: events, notifications, retries.' },
    { name: 'scheduler-worker', desc: 'Cron worker for scheduled tasks: scheduled rides, reports, cleanup.' },
  ];

  for (const app of apps) {
    file(`apps/${app.name}/src/index.ts`, `/**
 * ${app.name} — ${app.desc}
 *
 * Entry point: initialize config → set up infrastructure → register handlers → start.
 */
console.log('${app.name} starting...');
// TODO: implement initialization
`);

    file(`apps/${app.name}/README.md`, `# ${app.name}\n\n${app.desc}\n\n## Status\nPlaceholder — implementation in Phase 1.\n`);
  }
}

// ─────────────────────────────────────────────
// 12. TOOLS
// ─────────────────────────────────────────────
function genTools() {
  file('tools/scripts/README.md', `# Scripts\n\nBuild, deploy, test, lint utility scripts.\n`);
  file('tools/generators/README.md', `# Generators\n\nCode generators: new domain, new use case, new app.\n`);
  file('tools/migrations/README.md', `# Migration Tools\n\nCreate, run, rollback, validate migrations.\n`);
  file('tools/seed/README.md', `# Seed Data\n\nDevelopment, test, demo seed data.\n`);
  file('tools/local-dev/README.md', `# Local Development\n\nSetup guide: docker-compose, env, Telegram polling mode.\n`);
  file('tools/local-dev/docker-compose.yaml', `version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: tos
      POSTGRES_PASSWORD: tos_dev
      POSTGRES_DB: tos_v2
    ports:
      - "5432:5432"
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
`);
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
console.log('Generating TOS V2 skeleton...');

genRootConfig();
console.log('  Root config ✓');

genGlossary();
console.log('  Glossary ✓');

genADRs();
console.log('  ADRs (18) ✓');

genArchDocs();
console.log('  Architecture docs ✓');

genShared();
console.log('  Shared package ✓');

genCoreDomains();
console.log('  Core domains (12) ✓');

genPlannedDomains();
console.log('  Planned domains (11) + YAML ✓');

genApplicationLayer();
console.log('  Application layer (44 use cases) ✓');

genInfrastructure();
console.log('  Infrastructure ✓');

genSupportPackages();
console.log('  Config/DB/Testing/Observability ✓');

genApps();
console.log('  Apps (12) ✓');

genTools();
console.log('  Tools ✓');

console.log('\nDone! TOS V2 skeleton generated.');
