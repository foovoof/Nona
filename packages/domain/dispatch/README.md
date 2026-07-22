# Dispatch Domain

## Responsibility
Matching available drivers to transport jobs, ranking candidates, managing offer flow.

## What It Owns
Dispatch aggregate, DriverCandidate, RankedDriver, offer retry logic.

## What It Does NOT Own
Driver data (identity), job lifecycle (transport-job), fare calculation (pricing).

## Events Emitted
- `DispatchRequested`
- `DriversRanked`
- `OfferSent`
- `OfferExpired`

## Events Consumed
- `JobCreated`
- `OfferAccepted`
- `OfferRejected`

## Architectural Constraints
- Domain never imports Infrastructure, SDKs, or process.env
- All external access through Ports
- Events for cross-domain communication
