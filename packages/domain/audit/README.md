# Audit Domain

## Responsibility
Audit logging for all significant system actions. Event sourcing, compliance, investigation support.

## What It Owns
AuditEntry, AuditAction, AuditSubject.

## What It Does NOT Own
Safety investigations (safety), financial reconciliation (financial).

## Events Emitted
- `AuditRecorded`

## Events Consumed
- `JobCreated`
- `JobCompleted`
- `PaymentSettled`
- `EmergencyRaised`
- `DriverFlagged`

## Architectural Constraints
- Domain never imports Infrastructure, SDKs, or process.env
- All external access through Ports
- Events for cross-domain communication
