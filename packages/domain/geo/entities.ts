import { Entity, AggregateRoot, ValueObject, DomainEvent, DomainError } from '@tos/shared/kernel';
import { Result, ok, fail } from '@tos/shared/result';
import type { Port, Repository } from '@tos/shared/contracts';

// TODO: Implement domain entities extending AggregateRoot
// Example:
// export class GeoAggregate extends AggregateRoot<GeoId> {
//   // properties and business methods
// }
