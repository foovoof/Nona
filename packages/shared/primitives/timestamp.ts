export class Timestamp {
  private readonly value: Date;

  private constructor(date: Date) { this.value = date; }

  static now(): Timestamp { return new Timestamp(new Date()); }
  static fromISO(iso: string): Timestamp { return new Timestamp(new Date(iso)); }

  toISO(): string { return this.value.toISOString(); }
  toDate(): Date { return new Date(this.value); }
  isBefore(other: Timestamp): boolean { return this.value < other.value; }
  isAfter(other: Timestamp): boolean { return this.value > other.value; }
}
