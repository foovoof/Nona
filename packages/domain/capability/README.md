# Capability Domain

## Responsibility
Fine-grained authorization for drivers. Grants/revokes capabilities based on city, vehicle type, service type.

## What It Owns
Capability aggregate, GrantScope, CapabilityConditions.

## What It Does NOT Own
User data (identity), policy evaluation (policy).

## Events Emitted
- `CapabilityGranted`
- `CapabilityRevoked`
- `CapabilityExpired`

## Events Consumed
- `KYCDocumentsApproved`
- `DriverSuspended`

## Architectural Constraints
- Domain never imports Infrastructure, SDKs, or process.env
- All external access through Ports
- Events for cross-domain communication
