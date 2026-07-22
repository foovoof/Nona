import { AggregateRoot } from '@tos/shared/kernel';
import type { JobId, JobType, JobStatus } from './types';

export class TransportJob extends AggregateRoot<JobId> {
  private _type: JobType;
  private _status: JobStatus;
  private _riderId: string;
  private _driverId?: string;
  private _origin: { latitude: number; longitude: number };
  private _destination: { latitude: number; longitude: number };
  private _metadata: Record<string, unknown>;

  constructor(id: JobId, type: JobType, riderId: string, origin: any, destination: any) {
    super(id);
    this._type = type;
    this._status = 'draft';
    this._riderId = riderId;
    this._origin = origin;
    this._destination = destination;
    this._metadata = {};
  }

  get type(): JobType { return this._type; }
  get status(): JobStatus { return this._status; }
  get riderId(): string { return this._riderId; }
  get driverId(): string | undefined { return this._driverId; }
  get origin() { return this._origin; }
  get destination() { return this._destination; }

  // TODO: Implement status transition methods
  // request(), search(), assignDriver(), start(), complete(), cancel()
}
