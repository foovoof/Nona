export type UserRole = 'driver' | 'rider' | 'operator' | 'admin' | 'city_admin';
export type KYCStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';
export type UserId = string & { readonly __brand: 'UserId' };
export interface UserProfile { userId: string; displayName: string; phone: string; avatarUrl?: string; role: UserRole; }
