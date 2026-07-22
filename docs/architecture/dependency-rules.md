# Dependency Rules

## Per-Layer Import Rules

### Domain Layer
✅ self, @tos/shared/kernel, @tos/shared/primitives, @tos/shared/contracts, @tos/shared/result
❌ Infrastructure, Apps, SDKs, process.env, other domain internals

### Application Layer
✅ Domain ports, @tos/shared/*, @tos/config contracts
❌ SDK details (Supabase, Telegram, Mapbox), process.env directly

### Infrastructure Layer
✅ Ports (to implement), @tos/shared/*, SDKs, @tos/config
❌ Domain internals (entities, value objects, policies)

### Interfaces Layer
✅ Application use cases, DTOs, mappers, @tos/config
❌ Domain directly (must go through Application Layer)

### Config Package
✅ process.env (THE ONLY PLACE), zod for validation
❌ Nothing else reads env
