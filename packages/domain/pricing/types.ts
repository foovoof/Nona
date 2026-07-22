export interface PricingBreakdown { baseFare: bigint; perKmRate: bigint; perMinRate: bigint; distanceCharge: bigint; timeCharge: bigint; surgeMultiplier: number; discount: bigint; tolls: bigint; tip: bigint; total: bigint; currency: string; }
export interface FareEstimate { estimateId: string; breakdown: PricingBreakdown; validUntil: Date; }
export type SurgeLevel = 'normal' | 'moderate' | 'high' | 'extreme';
