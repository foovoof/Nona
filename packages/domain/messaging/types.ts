export type MessageType = 'text' | 'image' | 'location' | 'system';
export type ConversationId = string & { readonly __brand: 'ConversationId' };
export type MessageId = string & { readonly __brand: 'MessageId' };
export interface ConversationParticipant { userId: string; role: string; joinedAt: Date; }
