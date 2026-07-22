export interface IdempotencyStore {
  check(key: string): Promise<boolean>;
  store(key: string, result: unknown, ttlSeconds?: number): Promise<void>;
  get(key: string): Promise<unknown | null>;
}
