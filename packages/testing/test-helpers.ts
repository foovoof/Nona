import { randomUUID } from 'crypto';
export function createTestId(prefix?: string) { return prefix ? `${prefix}_${randomUUID()}` : randomUUID(); }
export function createTestDate() { return new Date('2026-01-01T00:00:00Z'); }
