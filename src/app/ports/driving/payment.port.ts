/**
 * PORTS · DRIVING (inbound / primary) — PaymentPort.
 * PURE TypeScript, ZERO @angular. The interface any driver calls to read the
 * payment posture or submit a payment. All money math lives behind this door,
 * inside the hexagon — a driver can invoke it but never become it.
 */
import { User } from '../../core/domain/user.entity';
import {
  PaymentHistory,
  PaymentRequest,
  PaymentResult,
  PaymentSnapshot,
} from '../../core/domain/payment.entity';

export interface PaymentPort {
  /** Deterministic snapshot of the borrower's payment posture. */
  getSnapshot(user: User): PaymentSnapshot;
  /**
   * Validate, decide and RECORD an authoritative payment. Async because storing it
   * leaves the process; a rejected or failed write comes back as `success: false`.
   */
  submit(user: User, request: PaymentRequest): Promise<PaymentResult>;
  /** The payments this borrower has made, newest first, with their running total. */
  getHistory(user: User): Promise<PaymentHistory>;
  /** Rule-derived suggested extra payment. */
  suggestedAmount(user: User): number;
  /** Available funding sources (reference data). */
  fundingSources(): string[];
}
