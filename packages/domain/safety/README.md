# Safety Domain

## Responsibility
Emergency handling, suspicious activity detection, driver flagging, safety case management.

## What It Owns
SafetyCase, Emergency, DriverFlag, Severity.

## What It Does NOT Own
User identity (identity), audit logging (audit).

## Events Emitted
- `EmergencyRaised`
- `DriverFlagged`
- `SuspiciousActivityDetected`
- `SafetyCaseEscalated`
- `SafetyCaseResolved`

## Events Consumed
- `JobStarted`
- `JobCompleted`

## Architectural Constraints
- Domain never imports Infrastructure, SDKs, or process.env
- All external access through Ports
- Events for cross-domain communication
