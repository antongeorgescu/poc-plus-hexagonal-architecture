/**
 * PORTS · DRIVEN (outbound / secondary) — PaymentRepositoryPort.
 * PURE TypeScript, ZERO @angular. The core OWNS this interface: it is how a
 * payment the domain has already DECIDED gets stored. The port never decides
 * anything — it persists a finished outcome and reports back, so the core never
 * names a database, an HTTP endpoint or a table.
 */
import { User } from '../../core/domain/user.entity';
import { PaymentApplyTo, PaymentHistoryEntry } from '../../core/domain/payment.entity';

/** One accepted payment plus the loan state the domain computed from it. */
export interface PaymentRecord {
  username: string;
  referenceNumber: string;
  amount: number;
  fundingSource: string;
  applyTo: PaymentApplyTo;
  effectiveDate: string; // ISO yyyy-mm-dd
  /** Balance the decision was based on — lets the store reject a stale write. */
  expectedBalance: number;
  /** Loan/schedule fields after the payment, as computed by the domain. */
  updated: Pick<
    User,
    'currentBalance' | 'nextPaymentDate' | 'nextPaymentAmount' | 'paymentsMade' | 'onTimeStreak'
  >;
}

/** A failed write is a value, not an exception (see PORTS.md conventions). */
export interface PaymentRecordOutcome {
  success: boolean;
  message: string;
  /** The borrower as now stored — the source of truth after a successful write. */
  user?: User;
}

/** The stored ledger for one borrower, in no particular order (the domain orders it). */
export interface PaymentHistoryOutcome {
  success: boolean;
  message: string;
  entries: PaymentHistoryEntry[];
}

export interface PaymentRepositoryPort {
  record(payment: PaymentRecord): Promise<PaymentRecordOutcome>;
  /** Every payment recorded for this borrower. A failed read is `success: false`, not an exception. */
  history(username: string): Promise<PaymentHistoryOutcome>;
}
