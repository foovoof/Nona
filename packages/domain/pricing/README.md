# Pricing Domain

## Responsibility
Fare calculation for all service types. Base fare, per-km, per-minute, surge, discounts, tolls, tips.

## What It Owns
FareEstimate, PricingBreakdown, SurgeZone, commission rules.

## What It Does NOT Own
Payment processing (financial), job lifecycle (transport-job).

## Events Emitted
- `FareEstimated`
- `SurgeLevelChanged`

## Events Consumed


## Architectural Constraints
- Domain never imports Infrastructure, SDKs, or process.env
- All external access through Ports
- Events for cross-domain communication
