export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'payment' | 'emergency';
export interface AuditSubject { type: string; id: string; }
export interface AuditMetadata { ipAddress?: string; userAgent?: string; correlationId?: string; }
