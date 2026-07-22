import type { RefundPaymentInput } from './input';
import type { RefundPaymentResult } from './output';

/**
 * RefundPayment Use Case Handler
 *
 * Description: Process a refund
 * Required ports: FinancialRepository, PaymentGateway
 *
 * Flow:
 * 1. Validate input
 * 2. Call domain services/repositories via ports
 * 3. Return Result<Output, Error>
 */
export class RefundPaymentHandler {
  // TODO: Inject ports via constructor
  // constructor(
  //   private readonly repository: SomeRepository,
  //   private readonly service: SomeService,
  // ) {}

  async execute(input: RefundPaymentInput): Promise<RefundPaymentResult> {
    // Step 1: Validate input
    // Step 2: Call domain operations
    // Step 3: Return result
    throw new Error('Not implemented');
  }
}
