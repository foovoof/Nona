import { randomUUID } from 'crypto';

export type Brand<T, B extends string> = T & { readonly __brand: B };
export type EntityId = Brand<string, 'EntityId'>;

export function generateId(prefix?: string): string {
  const uuid = randomUUID();
  return prefix ? `${prefix}_${uuid}` : uuid;
}
