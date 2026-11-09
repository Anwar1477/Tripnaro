import type { PaymentProviderName } from '../../models/Payment';

export interface PaymentContext {
  transactionId: string;
  amount: number;
  currency: string;
  description: string;
  customer: { name: string; email: string; phone: string };
  /** Where the provider should send the customer / callback after payment. */
  callbackUrl: string;
  cancelUrl: string;
}

export interface InitiateResult {
  redirectUrl: string;
  providerReference?: string;
  raw?: unknown;
}

export interface VerifyResult {
  status: 'success' | 'failed' | 'cancelled';
  providerReference?: string;
  amount?: number;
  reason?: string;
  raw?: unknown;
}

/**
 * Every payment gateway implements this contract. `verify` MUST confirm the outcome with the
 * provider (server-to-server); callback parameters from the browser are never trusted alone.
 */
export interface PaymentAdapter {
  readonly name: PaymentProviderName;
  readonly label: string;
  readonly isDemo: boolean;
  isConfigured(): boolean;
  initiate(ctx: PaymentContext): Promise<InitiateResult>;
  verify(
    payment: { transactionId: string; amount: number; currency: string; providerReference?: string | null },
    callbackParams: Record<string, string>,
  ): Promise<VerifyResult>;
}
