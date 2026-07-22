import type { SendMessageInput } from './input';
import type { SendMessageResult } from './output';

/**
 * SendMessage Use Case Handler
 *
 * Description: Send a message in a conversation
 * Required ports: MessagingRepository, NotificationPort
 *
 * Flow:
 * 1. Validate input
 * 2. Call domain services/repositories via ports
 * 3. Return Result<Output, Error>
 */
export class SendMessageHandler {
  // TODO: Inject ports via constructor
  // constructor(
  //   private readonly repository: SomeRepository,
  //   private readonly service: SomeService,
  // ) {}

  async execute(input: SendMessageInput): Promise<SendMessageResult> {
    // Step 1: Validate input
    // Step 2: Call domain operations
    // Step 3: Return result
    throw new Error('Not implemented');
  }
}
