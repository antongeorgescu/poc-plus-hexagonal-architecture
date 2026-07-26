/**
 * PORTS · DRIVING (inbound / primary) — PaymentPort.
 * PURE TypeScript, ZERO @angular. The interface any driver calls to read the
 * payment posture or submit a payment. All money math lives behind this door,
 * inside the hexagon — a driver can invoke it but never become it.
 */
import { User } from '../../core/domain/user.entity';
import {
  PaymentRequest,
  PaymentResult,
  PaymentSnapshot,
} from '../../core/domain/payment.entity';

export interface PaymentPort {
  /** Deterministic snapshot of the borrower's payment posture. */
  getSnapshot(user: User): PaymentSnapshot;
  /** Validate + process an authoritative payment. */
  submit(user: User, request: PaymentRequest): PaymentResult;
  /** Rule-derived suggested extra payment. */
  suggestedAmount(user: User): number;
  /** Available funding sources (reference data). */
  fundingSources(): string[];
}
