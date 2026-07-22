# Geo Domain

## Responsibility
Geographic services — service areas, geofencing, zone management, distance/time calculation.

## What It Owns
ServiceArea, Zone, Geofence, Route, Address.

## What It Does NOT Own
GeoPoint primitive (shared/kernel), pricing (pricing).

## Events Emitted
- `ServiceAreaUpdated`
- `ZoneEntered`
- `ZoneExited`
- `GeofenceTriggered`

## Events Consumed


## Architectural Constraints
- Domain never imports Infrastructure, SDKs, or process.env
- All external access through Ports
- Events for cross-domain communication
