export type ServiceAreaId = string & { readonly __brand: 'ServiceAreaId' };
export type ZoneId = string & { readonly __brand: 'ZoneId' };
export interface Address { street: string; city: string; state: string; country: string; postalCode: string; geoPoint: { latitude: number; longitude: number }; }
export interface Route { distance: number; duration: number; polyline: string; }
