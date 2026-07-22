# TOS V2 — Glossary

> Unified terminology for the Transportation Operating System.
> Every term listed here has a single, agreed-upon meaning.
> Do NOT use alternative names for the same concept.

## Core Platform

### TOS
Transportation Operating System — the platform that orchestrates transport services.

### Core Platform
The shared infrastructure, domain logic, and application layer that powers all TOS surfaces.

## Architecture

### Interface
An adapter that connects an external surface (Telegram, Web, API) to the Application Layer. Never calls Domain directly.

### Adapter
A concrete implementation of a Port. Adapters live in the Infrastructure Layer.

### Application Layer
Orchestrates domain objects to fulfill use cases. Contains no business rules — only coordination.

### Use Case
A single application operation (e.g., RequestRide). Has an Input, Output, Handler, and Errors.

### Domain
A bounded context containing business logic, entities, value objects, and events.

### Domain Engine
A core subsystem that provides domain-specific logic (e.g., Pricing Engine, Dispatch Engine).

### Shared Kernel
The most stable cross-domain primitives: Entity, AggregateRoot, ValueObject, DomainEvent, DomainError.

## Transport

### Transport Job
The central aggregate representing any transport request. Unified entity supporting ride, delivery, courier, and other job types.

### Job
Short name for Transport Job. A single transport request with a lifecycle defined by a workflow state machine.

### Ride
A Transport Job of type "ride" — passenger transport from origin to destination.

### Delivery
A Transport Job of type "delivery" — package transport from sender to recipient.

### Courier
A Transport Job of type "courier" — multi-stop pickup and dropoff service.

## Dispatch

### Offer
A proposal sent to a driver for a specific Job. Contains price, route, and expiration.

## Identity

### Driver
A user with role "driver" who fulfills transport jobs.

### Rider
A user with role "rider" who requests transport services.

### City Operator
A user with role "operator" who manages TOS operations for a specific city.

## Capability

### Capability
A granted permission (city_access, vehicle_type, service_type) that authorizes a driver for specific work.

### Scope
The boundaries of a Capability grant (e.g., city_id = "city_001").

### Condition
Additional constraints on a Capability (e.g., time_restriction: weekdays only).

## Policy

### Policy
An externalized business rule that evaluates to allow/deny/modify. Defined in YAML, evaluated by the Policy Engine.

## Workflow

### Workflow
A declarative state machine defining valid state transitions for an aggregate (e.g., Job lifecycle).

## Architecture

### Event
Something that happened in the system. Events are immutable facts.

### Domain Event
An Event raised by a Domain aggregate. Carries aggregateId, eventName, payload, correlationId.

## Infrastructure

### Idempotency Key
A unique key ensuring an operation is only executed once, even if retried.

## Geo

### Service Area
A geographic region where a specific service is available.

## Infrastructure

### Feature Flag
A toggle that enables/disables features per city, user segment, or percentage rollout.

## Service Registry

### Service Registry
A catalog of available services (ride, delivery, VIP, etc.) with their requirements and capabilities.

## Identity

### Identity
The domain that manages user accounts, authentication, roles, and profile data.

### KYC
Know Your Customer — identity verification process for drivers.

## Safety

### Safety Case
A formal record of a safety incident (emergency, complaint, accident) requiring investigation.

## Reputation

### Reputation
The domain that calculates trust scores from ratings, completion rates, and incidents.

### Trust Score
A composite score (0-100) reflecting a driver/reliability based on multiple signals.

## Financial

### Financial Transaction
A monetary operation (charge, commission, payout, refund) tied to a job.

### Settlement
The process of transferring accumulated earnings to a driver wallet or bank account.

## Architecture

### Bounded Context
A clear boundary within which a domain model is defined and applicable.

### Aggregate Root
The consistency boundary for a cluster of entities. All mutations go through the root.

### Entity
A domain object defined by its identity. Two entities with the same ID are the same entity.

### Value Object
An immutable domain object defined by its attributes. Compared by structural equality.

### Port
An interface defined by the domain/application that infrastructure must implement.

### Port Adapter
An infrastructure implementation of a Port (e.g., SupabaseRepository implements Repository).

### Repository
A Port that abstracts persistence for a specific aggregate.

### Unit of Work
A Port that manages transactional boundaries. All operations in a use case share one transaction.

### Command
An input DTO representing an intent to change system state (e.g., RequestRideCommand).

### DTO
Data Transfer Object — a plain object for data exchange between layers. No behavior.

### Mapper
A function that converts between Domain entities and DTOs. Prevents domain leakage.

## Geo

### City
A geographic and administrative unit where TOS operates. Has its own policies, zones, and operators.

### Zone
A subdivision of a City with specific rules (e.g., airport zone, downtown zone).

## Pricing

### Surge
A pricing multiplier applied when demand exceeds supply in a specific area.

## Dispatch

### Dispatch
The process of matching available drivers to transport jobs.

### Assignment
The result of dispatch — a specific driver assigned to a specific job.

## Reputation

### Rating
A numerical score (1-5) given by rider or driver after a completed job.

