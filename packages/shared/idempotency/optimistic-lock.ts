export interface OptimisticLock {
  version: number;
  updatedAt: Date;
}

export function checkVersion(current: OptimisticLock, expected: number): boolean {
  return current.version === expected;
}
