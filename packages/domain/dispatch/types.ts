export type DispatchStrategy = 'nearest' | 'round_robin' | 'priority' | 'batch';
export type DispatchId = string & { readonly __brand: 'DispatchId' };
export interface DriverCandidate { driverId: string; distance: number; score: number; eta: number; }
export interface RankedDriver { driverId: string; rank: number; score: number; }
