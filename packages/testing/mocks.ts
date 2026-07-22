export class MockRepository {
  private store = new Map();
  async findById(id: string) { return this.store.get(id) ?? null; }
  async save(entity: any) { this.store.set(entity.id, entity); }
  async delete(id: string) { this.store.delete(id); }
}
