export class PhoneNumber {
  readonly countryCode: string;
  readonly number: string;

  constructor(countryCode: string, number: string) {
    this.countryCode = countryCode;
    this.number = number;
  }

  format(): string { return `+${this.countryCode}${this.number}`; }

  static isValid(countryCode: string, number: string): boolean {
    return /^\d{1,4}$/.test(countryCode) && /^\d{6,15}$/.test(number);
  }
}
