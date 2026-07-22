import type { StartJobInput } from './input';
import type { StartJobResult } from './output';

/**
 * StartJob Use Case Handler
 *
 * Description: Job transitions to in_progress
 * Required ports: TransportJobRepository
 *
 * Flow:
 * 1. Validate input
 * 2. Call domain services/repositories via ports
 * 3. Return Result<Output, Error>
 */
export class StartJobHandler {
  // TODO: Inject ports via constructor
  // constructor(
  //   private readonly repository: SomeRepository,
  //   private readonly service: SomeService,
  // ) {}

  async execute(input: StartJobInput): Promise<StartJobResult> {
    // Step 1: Validate input
    // Step 2: Call domain operations
    // Step 3: Return result
    throw new Error('Not implemented');
  }
}
