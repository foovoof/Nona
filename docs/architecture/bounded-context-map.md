# Bounded Context Map

## Contexts

| Context | Responsibility | Relationship Type |
|---------|---------------|-------------------|
| **Shared Kernel** | Entity, AggregateRoot, ValueObject, Money, GeoPoint | Partnership (all) |
| **Transport Job** | Job lifecycle, types, state machine | Customer: pricing, dispatch. Supplier: financial, audit |
| **Dispatch** | Driver-job matching, offer management | Customer: transport-job, pricing, capability, safety, service-registry |
| **Pricing** | Fare calculation, surge, commission | Supplier: dispatch, financial |
| **Scheduling** | Scheduled tasks, cron, retry | Customer: transport-job, dispatch |
| **Identity** | User accounts, auth, roles, KYC | Supplier: capability, safety |
| **Capability** | Authorization grants, scopes | Customer: identity. Supplier: dispatch |
| **Safety** | Emergencies, flags, investigations | Customer: identity |
| **Financial** | Transactions, settlements, wallets | Customer: transport-job, pricing |
| **Audit** | Event logging, compliance | Customer: ALL (observes events) |
| **Notification** | Push, SMS, email delivery | Customer: ALL (consumed by all) |
| **Messaging** | In-app chat between parties | Customer: identity, notification |
| **Geo** | Service areas, zones, geofencing | Supplier: transport-job, dispatch, pricing |
| **Service Registry** | Service definitions and requirements | Published Language (read by dispatch, pricing) |
| **Policy** | Business rule evaluation | Published Language (read by capability, dispatch) |
| **Workflow** | State machine definitions | Published Language (read by all stateful domains) |
