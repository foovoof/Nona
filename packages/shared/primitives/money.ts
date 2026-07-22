export class Money {
  private readonly amount: bigint;
  private readonly currency: string;

  constructor(amount: bigint, currency: string) {
    this.amount = amount;
    this.currency = currency.toUpperCase();
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) throw new Error('Currency mismatch');
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) throw new Error('Currency mismatch');
    return new Money(this.amount - other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(BigInt(Math.round(Number(this.amount) * factor)), this.currency);
  }

  isGreaterThan(other: Money): boolean {
    return this.amount > other.amount;
  }

  isZero(): boolean { return this.amount === 0n; }
  toNumber(): number { return Number(this.amount); }
  toString(): string { return `${this.currency} ${this.amount}`; }
}
