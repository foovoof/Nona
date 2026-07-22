// Metadata validation schemas per job type.
// Each job.type has a specific metadata shape.
// TODO: Implement Zod schemas for each type.

export interface RideMetadata {
  passengerCount: number;
  vehiclePreference?: 'sedan' | 'suv' | 'hatchback';
}

export interface DeliveryMetadata {
  packageWeight: number;
  packageDimensions: { length: number; width: number; height: number };
  recipientPhone: string;
  isfragile: boolean;
}

export interface CourierMetadata {
  stops: Array<{ address: string; action: 'pickup' | 'dropoff'; contactPhone: string }>;
  totalWeight: number;
}

export interface AirportPickupMetadata {
  flightNumber: string;
  arrivalTime: string;
  terminal: string;
  meetAndGreet: boolean;
}

export interface VIPMetadata {
  vehicleClass: 'luxury' | 'premium' | 'executive';
  specialRequests?: string[];
}

export interface ScheduledMetadata {
  scheduledAt: string;
  recurrence?: 'daily' | 'weekly' | 'none';
  notifyBefore: number; // minutes
}

export interface EmergencyMetadata {
  emergencyType: 'medical' | 'accident' | 'crime' | 'breakdown';
  description: string;
  contactAuthorities: boolean;
}
