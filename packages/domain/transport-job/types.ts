export type JobType = 'ride' | 'delivery' | 'courier' | 'airport_pickup' | 'vip' | 'scheduled' | 'emergency' | 'rental' | 'corporate' | 'government' | 'shuttle' | 'fleet_task';
export type JobStatus = 'draft' | 'requested' | 'searching' | 'offered' | 'accepted' | 'driver_arrived' | 'in_progress' | 'completed' | 'cancelled' | 'failed' | 'expired';
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
export type JobId = string & { readonly __brand: 'JobId' };
export type OfferId = string & { readonly __brand: 'OfferId' };
