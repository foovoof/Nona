import type { VerifyPhoneInput } from './input';
import type { VerifyPhoneResult } from './output';

/**
 * VerifyPhone Use Case Handler
 *
 * Description: Send and verify phone OTP
 * Required ports: IdentityRepository, NotificationService
 *
 * Flow:
 * 1. Validate input
 * 2. Call domain services/repositories via ports
 * 3. Return Result<Output, Error>
 */
export class VerifyPhoneHandler {
  // TODO: Inject ports via constructor
  // constructor(
  //   private readonly repository: SomeRepository,
  //   private readonly service: SomeService,
  // ) {}

  async execute(input: VerifyPhoneInput): Promise<VerifyPhoneResult> {
    // Step 1: Validate input
    // Step 2: Call domain operations
    // Step 3: Return result
    throw new Error('Not implemented');
  }
}
