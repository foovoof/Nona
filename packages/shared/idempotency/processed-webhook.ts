export interface ProcessedWebhook {
  webhookId: string;
  source: string;
  processedAt: Date;
  result: 'success' | 'failed' | 'skipped';
}
