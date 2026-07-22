import type { EventName } from './event-names';

export interface EventSchema {
  eventName: EventName;
  version: number;
  schema: Record<string, unknown>;
}

export interface EventRegistry {
  register(entry: EventSchema): void;
  getSchema(eventName: EventName): EventSchema | undefined;
  validate(eventName: EventName, payload: unknown): boolean;
}
