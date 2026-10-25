/**
 * CORE · APPLICATION — Payment use case.
 * PURE TypeScript, ZERO @angular. IMPLEMENTS the driving port (PaymentPort).
 * All validation and money math live in the Payment entity; this application
 * service exposes them as authoritative operations behind the port and hands an
 * accepted payment to the PaymentRepositoryPort to be stored. It depends only on
 * that driven-port interface, supplied by the composition root.
 */
import { PaymentPort } from '../../ports/driving/payment.port';
import { PaymentRepositoryPort } from '../../ports/driven/payment-repository.port';
import { User } from '../domain/user.entity';
import {
  applyPayment,
  buildPaymentHistory,
  buildPaymentSnapshot,
  fundingSources,
  processPayment,
  suggestExtraPayment,
  PaymentHistory,
  PaymentRequest,
  PaymentResult,
  PaymentSnapshot,
} from '../domain/payment.entity';

export class PaymentService implements PaymentPort {
  constructor(private readonly payments: PaymentRepositoryPort) {}

  getSnapshot(user: User): PaymentSnapshot {
    return buildPaymentSnapshot(user);
  }

  async submit(user: User, request: PaymentRequest): Promise<PaymentResult> {
    // The domain decides first; nothing is stored for a rejected payment.
    const result = processPayment(user, request);
    if (!result.success) return result;

    const updated = applyPayment(user, request, result);
    const outcome = await this.payments.record({
      username: user.username,
      referenceNumber: result.referenceNumber!,
      amount: request.amount,
      fundingSource: request.fundingSource,
      applyTo: request.applyTo,
      effectiveDate: request.effectiveDate,
      expectedBalance: user.currentBalance,
      updated: {
        currentBalance: updated.currentBalance,
        nextPaymentDate: updated.nextPaymentDate,
        nextPaymentAmount: updated.nextPaymentAmount,
        paymentsMade: updated.paymentsMade,
        onTimeStreak: updated.onTimeStreak,
      },
    });
    // A failed write must not be reported as a confirmed payment.
    if (!outcome.success) return { success: false, message: outcome.message };

    return { ...result, updatedUser: outcome.user ?? updated };
  }

  async getHistory(user: User): Promise<PaymentHistory> {
    const outcome = await this.payments.history(user.username);
    // An unreadable ledger is reported as such — never shown as "no payments".
    if (!outcome.success) {
      return { success: false, message: outcome.message, entries: [], count: 0, totalPaid: 0 };
    }
    return buildPaymentHistory(outcome.entries);
  }

  suggestedAmount(user: User): number {
    return suggestExtraPayment(user);
  }

  fundingSources(): string[] {
    return fundingSources();
  }
}
