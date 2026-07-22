# Identity Domain

## Responsibility
User identity for all user types (driver, rider, operator, admin). Auth, profiles, phone verification, KYC.

## What It Owns
User aggregate, UserProfile, KYCStatus, KYCDocument.

## What It Does NOT Own
Capability grants (capability), safety flags (safety).

## Events Emitted
- `UserRegistered`
- `UserProfileUpdated`
- `PhoneVerified`
- `KYCDocumentsSubmitted`
- `KYCDocumentsApproved`
- `DriverApproved`
- `DriverSuspended`

## Events Consumed


## Architectural Constraints
- Domain never imports Infrastructure, SDKs, or process.env
- All external access through Ports
- Events for cross-domain communication
