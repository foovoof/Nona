import type { JobType, JobStatus } from './types';

type TransitionMap = Record<JobStatus, JobStatus[]>;

const rideTransitions: TransitionMap = {
  draft: ['requested'],
  requested: ['searching', 'cancelled'],
  searching: ['offered', 'cancelled', 'failed'],
  offered: ['accepted', 'expired', 'cancelled'],
  accepted: ['driver_arrived', 'cancelled'],
  driver_arrived: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled', 'failed'],
  completed: [],
  cancelled: [],
  failed: [],
  expired: [],
};

const deliveryTransitions: TransitionMap = {
  ...rideTransitions,
  in_progress: ['completed', 'cancelled', 'failed'],
  // TODO: add proof_submitted, confirmed states
};

const scheduledTransitions: TransitionMap = {
  draft: ['requested'],
  requested: ['searching'],
  searching: ['offered', 'failed'],
  offered: ['accepted', 'expired'],
  accepted: ['driver_arrived'],
  driver_arrived: ['in_progress'],
  in_progress: ['completed', 'failed'],
  completed: [],
  cancelled: [],
  failed: [],
  expired: [],
};

const transitionMaps: Record<JobType, TransitionMap> = {
  ride: rideTransitions,
  delivery: deliveryTransitions,
  courier: deliveryTransitions,
  airport_pickup: rideTransitions,
  vip: rideTransitions,
  scheduled: scheduledTransitions,
  emergency: { ...rideTransitions, requested: ['searching', 'cancelled'], searching: ['offered', 'failed'] },
  rental: rideTransitions,
  corporate: rideTransitions,
  government: rideTransitions,
  shuttle: rideTransitions,
  fleet_task: scheduledTransitions,
};

export function canTransition(type: JobType, from: JobStatus, to: JobStatus): boolean {
  return transitionMaps[type]?.[from]?.includes(to) ?? false;
}
