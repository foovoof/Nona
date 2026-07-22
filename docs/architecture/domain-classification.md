# Domain Classification

## Core Domains (full structure — 12)

| Domain | Why Core |
|--------|----------|
| transport-job | Central aggregate, everything depends on it |
| dispatch | Critical path for every job |
| pricing | Every job needs a price |
| scheduling | Scheduled rides, recurring tasks |
| identity | All users need accounts |
| capability | Driver authorization is critical |
| safety | Emergency handling cannot be deferred |
| financial | Money flow is core business |
| audit | Compliance requires audit trail from day 1 |
| notification | Users need feedback on every action |
| messaging | Rider-driver communication is essential |
| geo | Location is fundamental to transport |

## Planned Domains (lightweight — 11)

| Domain | Why Planned | Notes |
|--------|------------|-------|
| delivery | Deferred proof/OTP | Job lifecycle in transport-job |
| reputation | Needs job history data | Contracts defined |
| policy | Core contracts defined | Implementation deferred |
| workflow | Core contracts defined | Implementation deferred |
| service-registry | Core contracts defined | Implementation deferred |
| feature-flags | Cross-cutting concern | Lives in packages/config |
| operations-intelligence | Needs event sourcing | Prerequisites documented |
| support | Needs stable core flow | After MVP |
| emergency | Merged into safety | Directory kept for extraction |
| documents | Supabase Storage suffices | For now |
| kyc | Merged into identity | Directory kept for extraction |

## Future Domains (docs only — 12)

fleet, corporate, government, shuttle, rental, fraud, risk, advanced-analytics, ai-optimization, advanced-settlements, marketplace, external-partner-api

See: `docs/roadmap/future-domains.md`
