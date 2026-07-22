import { Entity } from '@tos/shared/kernel';
import type { OfferId, OfferStatus } from './types';

export class JobOffer extends Entity<OfferId> {
  private _jobId: string;
  private _driverId: string;
  private _status: OfferStatus;
  private _price: bigint;
  private _expiresAt: Date;
  private _respondedAt?: Date;

  constructor(id: OfferId, jobId: string, driverId: string, price: bigint, expiresAt: Date) {
    super(id);
    this._jobId = jobId;
    this._driverId = driverId;
    this._status = 'pending';
    this._price = price;
    this._expiresAt = expiresAt;
  }

  get jobId(): string { return this._jobId; }
  get driverId(): string { return this._driverId; }
  get status(): OfferStatus { return this._status; }
  get price(): bigint { return this._price; }
  get expiresAt(): Date { return this._expiresAt; }

  // TODO: accept(), reject(), expire()
}
