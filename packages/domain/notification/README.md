# Notification Domain

## Responsibility
Multi-channel notification delivery (push, SMS, email, in-app). Template management, delivery tracking.

## What It Owns
Notification, DeliveryStatus, Template, UserPreferences.

## What It Does NOT Own
In-app messaging (messaging), email infrastructure (infrastructure).

## Events Emitted
- `NotificationSent`
- `NotificationDelivered`
- `NotificationFailed`

## Events Consumed
- `JobCreated`
- `JobCompleted`
- `OfferSent`
- `EmergencyRaised`

## Architectural Constraints
- Domain never imports Infrastructure, SDKs, or process.env
- All external access through Ports
- Events for cross-domain communication
