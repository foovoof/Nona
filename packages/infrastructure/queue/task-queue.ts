export class TaskQueue {
  async enqueue(task: string, payload: any, delay?: number) { throw new Error('Not implemented'); }
  async getTask(id: string) { throw new Error('Not implemented'); }
}
