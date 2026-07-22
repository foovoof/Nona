export class StripeClient {
  constructor(private readonly secretKey: string) {}
  async createPaymentIntent(amount: number, currency: string) { throw new Error('Not implemented'); }
  async capturePayment(intentId: string) { throw new Error('Not implemented'); }
  async createRefund(paymentId: string, amount?: number) { throw new Error('Not implemented'); }
}
