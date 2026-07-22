import { canTransition } from './job-status-machine';
import type { JobStatus, JobType } from './types';

export function validateTransition(type: JobType, from: JobStatus, to: JobStatus): boolean {
  return canTransition(type, from, to);
}

// TODO: Implement transition side effects
// export function requestJob(job: TransportJob): void { ... }
// export function searchDrivers(job: TransportJob): void { ... }
// export function sendOffer(job: TransportJob, driverId: string): void { ... }
// export function acceptOffer(job: TransportJob, offerId: string): void { ... }
// export function startJob(job: TransportJob): void { ... }
// export function completeJob(job: TransportJob): void { ... }
// export function cancelJob(job: TransportJob, reason: string): void { ... }
