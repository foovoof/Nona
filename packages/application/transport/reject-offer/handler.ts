import type { RejectOfferInput } from './input';
import type { RejectOfferResult } from './output';

/**
 * RejectOffer Use Case Handler
 *
 * Description: Driver rejects a job offer
 * Required ports: JobOfferRepository
 *
 * Flow:
 * 1. Validate input
 * 2. Call domain services/repositories via ports
 * 3. Return Result<Output, Error>
 */
export class RejectOfferHandler {
  // TODO: Inject ports via constructor
  // constructor(
  //   private readonly repository: SomeRepository,
  //   private readonly service: SomeService,
  // ) {}

  async execute(input: RejectOfferInput): Promise<RejectOfferResult> {
    // Step 1: Validate input
    // Step 2: Call domain operations
    // Step 3: Return result
    throw new Error('Not implemented');
  }
}
