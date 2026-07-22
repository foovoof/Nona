export function withCorrelation<T>(correlationId: string, fn: () => Promise<T>): Promise<T> { return fn(); }
