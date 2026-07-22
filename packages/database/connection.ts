export class ConnectionPool {
  constructor(private readonly connectionString: string) {}
  async getConnection() { throw new Error('Not implemented'); }
}
