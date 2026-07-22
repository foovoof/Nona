import { createHash } from 'crypto';

export class IdempotencyKey {
  private readonly key: string;

  constructor(key: string) {
    if (!key || key.length < 8) throw new Error('Idempotency key too short');
    this.key = key;
  }

  static generate(prefix: string): IdempotencyKey {
    const hash = createHash('sha256').update(`${prefix}_${Date.now()}_${Math.random()}`).digest('hex');
    return new IdempotencyKey(`${prefix}_${hash.substring(0, 16)}`);
  }

  toString(): string { return this.key; }

  static isValid(key: string): boolean { return key.length >= 8; }
}
