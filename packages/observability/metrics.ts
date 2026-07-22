export class Metrics {
  increment(name: string, labels?: Record<string, string>) { /* TODO */ }
  gauge(name: string, value: number, labels?: Record<string, string>) { /* TODO */ }
  histogram(name: string, value: number, labels?: Record<string, string>) { /* TODO */ }
}
