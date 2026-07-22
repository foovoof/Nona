export type TaskStatus = 'pending' | 'executing' | 'completed' | 'failed' | 'dead';
export type ScheduledTaskId = string & { readonly __brand: 'ScheduledTaskId' };
export interface RetryPolicy { maxRetries: number; backoffMs: number; backoffMultiplier: number; }
export interface CronExpression { expression: string; timezone: string; }
