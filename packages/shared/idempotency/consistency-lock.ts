export interface ConsistencyLock {
  acquire(key: string, ttlSeconds: number): Promise<boolean>;
  release(key: string): Promise<void>;
}
