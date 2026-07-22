export abstract class DomainError {
  abstract readonly code: string;
  abstract readonly message: string;
  abstract readonly domain: string;

  toJSON() {
    return { code: this.code, message: this.message, domain: this.domain };
  }
}
