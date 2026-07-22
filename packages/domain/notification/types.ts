export type NotificationChannel = 'push' | 'sms' | 'email' | 'in_app';
export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
export interface NotificationTemplate { id: string; channel: NotificationChannel; subject: string; body: string; }
