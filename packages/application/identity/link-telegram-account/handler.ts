import type { LinkTelegramAccountInput } from './input';
import type { LinkTelegramAccountResult } from './output';

/**
 * LinkTelegramAccount Use Case Handler
 *
 * Description: Link Telegram chatId to user
 * Required ports: IdentityRepository
 *
 * Flow:
 * 1. Validate input
 * 2. Call domain services/repositories via ports
 * 3. Return Result<Output, Error>
 */
export class LinkTelegramAccountHandler {
  // TODO: Inject ports via constructor
  // constructor(
  //   private readonly repository: SomeRepository,
  //   private readonly service: SomeService,
  // ) {}

  async execute(input: LinkTelegramAccountInput): Promise<LinkTelegramAccountResult> {
    // Step 1: Validate input
    // Step 2: Call domain operations
    // Step 3: Return result
    throw new Error('Not implemented');
  }
}
