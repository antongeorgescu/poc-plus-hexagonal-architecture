/**
 * ADAPTERS · DRIVEN (secondary) — API payment repository.
 * IMPLEMENTS PaymentRepositoryPort by POSTing an accepted payment to the local API,
 * which writes payment_history and updates the loan and payment rows in one
 * transaction, and by reading the ledger back from GET /api/payments/history.
 * Any failure — rejected, stale, or API down — comes back as a `success: false`
 * value so the core never sees an exception.
 */
import {
  PaymentHistoryOutcome,
  PaymentRecord,
  PaymentRecordOutcome,
  PaymentRepositoryPort,
} from '../../ports/driven/payment-repository.port';

export class ApiPaymentRepository implements PaymentRepositoryPort {
  async record(payment: PaymentRecord): Promise<PaymentRecordOutcome> {
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payment),
      });
      const body = (await res.json().catch(() => null)) as PaymentRecordOutcome | null;
      if (res.ok && body?.success) return body;
      return {
        success: false,
        message: body?.message ?? `The payment could not be recorded (${res.status}).`,
      };
    } catch {
      return {
        success: false,
        message: 'The payment service is unavailable. Your payment was not recorded.',
      };
    }
  }

  async history(username: string): Promise<PaymentHistoryOutcome> {
    try {
      const res = await fetch(`/api/payments/history?username=${encodeURIComponent(username)}`);
      const body = (await res.json().catch(() => null)) as PaymentHistoryOutcome | null;
      if (res.ok && body?.success) return body;
      return {
        success: false,
        message: body?.message ?? `Your payment history could not be loaded (${res.status}).`,
        entries: [],
      };
    } catch {
      return {
        success: false,
        message: 'The payment service is unavailable. Your payment history could not be loaded.',
        entries: [],
      };
    }
  }
}
