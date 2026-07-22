export type CapabilityType = 'city_access' | 'vehicle_type' | 'service_type' | 'time_restriction';
export interface GrantScope { cityId?: string; vehicleType?: string; serviceType?: string; }
export interface Condition { type: string; value: unknown; }
