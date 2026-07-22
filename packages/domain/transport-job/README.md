# TransportJob Domain

## Responsibility
Unified transport job lifecycle (ride, delivery, courier, airport_pickup, vip, scheduled, emergency, rental, corporate, government, shuttle, fleet_task).

## What It Owns
Job aggregate, JobOffer, JobMetadata, JobEvent, status state machine.

## What It Does NOT Own
Driver data (identity), pricing calculation (pricing), driver matching (dispatch).

## Events Emitted
- `JobCreated`
- `JobStarted`
- `JobCompleted`
- `JobCancelled`
- `OfferSent`
- `OfferAccepted`
- `OfferRejected`
- `OfferExpired`

## Events Consumed
- `DriversRanked`
- `PaymentAuthorized`

## Architectural Constraints
- Domain never imports Infrastructure, SDKs, or process.env
- All external access through Ports
- Events for cross-domain communication
