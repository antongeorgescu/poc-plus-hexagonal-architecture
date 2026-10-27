/**
 * CORE · DOMAIN — Payment entity (enterprise money math + invariants).
 * PURE TypeScript, ZERO @angular. Validates a payment, applies business rules,
 * generates a confirmation reference. No UI, no framework, no AI.
 */
import { User } from './user.entity';
import { parseIsoDate } from './date.utility';

export type PaymentApplyTo = 'PRINCIPAL' | 'NEXT_INSTALLMENT';

export interface PaymentRequest {
  amount: number;
  fundingSource: string;
  effectiveDate: string; // ISO yyyy-mm-dd
  applyTo: PaymentApplyTo;
}

export interface PaymentResult {
  success: boolean;
  referenceNumber?: string;
  message: string;
  amount?: number;
  projectedBalance?: number;
  effectiveDate?: string;
  /** The borrower after the payment, as stored — set only once the write succeeded. */
  updatedUser?: User;
}

/** One payment the borrower actually made, as recorded in the ledger. */
export interface PaymentHistoryEntry {
  id: number;
  referenceNumber: string;
  amount: number;
  fundingSource: string;
  applyTo: PaymentApplyTo;
  effectiveDate: string; // ISO yyyy-mm-dd
  balanceAfter: number;
  /** Who created the record: 'user:<name>' (the borrower) or 'agent:<id>' (servicing staff). */
  createdBy: string;
  recordedAt: string; // ISO instant
}

/** The borrower's payments, newest first. `success: false` = the ledger could not be read. */
export interface PaymentHistory {
  success: boolean;
  message: string;
  entries: PaymentHistoryEntry[];
  count: number;
  totalPaid: number;
}

/** Deterministic snapshot of the borrower's payment posture. */
export interface PaymentSnapshot {
  monthlyPayment: number;
  nextPaymentAmount: number;
  nextPaymentDate: string;
  paymentsMade: number;
  paymentsMissed: number;
  onTimeStreak: number;
  isPastDue: boolean;
  pastDueAmount: number;
  suggestedExtraPayment: number;
}

/** Business rule: minimum accepted payment. */
const MIN_PAYMENT = 1;

/** Suggested extra payment = 10% of current balance, rounded to $25. */
export function suggestExtraPayment(user: User): number {
  const raw = user.currentBalance * 0.1;
  return Math.max(MIN_PAYMENT, Math.round(raw / 25) * 25);
}

/** Funding sources a borrower could pay from (mock reference data). */
export function fundingSources(): string[] {
  return ['Checking ••••1234', 'Savings ••••5678', 'Debit card ••••9012'];
}

/** Deterministic payment posture for the logged-in borrower. */
export function buildPaymentSnapshot(user: User): PaymentSnapshot {
  const isPastDue = user.nextPaymentAmount > user.monthlyPayment;
  return {
    monthlyPayment: user.monthlyPayment,
    nextPaymentAmount: user.nextPaymentAmount,
    nextPaymentDate: user.nextPaymentDate,
    paymentsMade: user.paymentsMade,
    paymentsMissed: user.paymentsMissed,
    onTimeStreak: user.onTimeStreak,
    isPastDue,
    pastDueAmount: isPastDue
      ? Math.round((user.nextPaymentAmount - user.monthlyPayment) * 100) / 100
      : 0,
    suggestedExtraPayment: suggestExtraPayment(user),
  };
}

/**
 * Validates and "processes" a payment. Returns a confirmation with a reference
 * number, or a failure with the reason. This is authoritative money math.
 */
export function processPayment(user: User, request: PaymentRequest): PaymentResult {
  if (!Number.isFinite(request.amount) || request.amount < MIN_PAYMENT) {
    return {
      success: false,
      message: `Please enter a payment of at least $${MIN_PAYMENT}.`,
    };
  }
  if (request.amount > user.currentBalance) {
    return {
      success: false,
      message: `The amount exceeds your current balance of $${user.currentBalance.toLocaleString()}. Enter your payoff amount or less.`,
    };
  }
  if (!request.fundingSource) {
    return { success: false, message: 'Please choose a funding source.' };
  }

  const projectedBalance =
    Math.round((user.currentBalance - request.amount) * 100) / 100;

  return {
    success: true,
    referenceNumber: generateReference(request.effectiveDate),
    amount: request.amount,
    projectedBalance,
    effectiveDate: request.effectiveDate,
    message:
      request.applyTo === 'PRINCIPAL'
        ? 'Your extra payment has been applied directly to your principal balance.'
        : 'Your payment has been applied to your next scheduled installment.',
  };
}

/**
 * Business rule: payment history is shown NEWEST FIRST — by the date the payment
 * took effect, with the later-recorded one first when two share a date. Also the one
 * place the running total is computed, so no driver ever adds up money itself.
 */
export function buildPaymentHistory(entries: PaymentHistoryEntry[]): PaymentHistory {
  const sorted = [...entries].sort(
    (a, b) => b.effectiveDate.localeCompare(a.effectiveDate) || b.id - a.id
  );
  const totalPaid = Math.round(sorted.reduce((sum, e) => sum + e.amount, 0) * 100) / 100;
  return { success: true, message: '', entries: sorted, count: sorted.length, totalPaid };
}

/**
 * Business rule: what an accepted payment does to the loan. Pure — returns the
 * borrower as they WILL be; persisting it is the PaymentRepositoryPort's job.
 *  - PRINCIPAL: only the balance falls.
 *  - NEXT_INSTALLMENT: a payment that covers the amount due completes the
 *    installment (count + streak advance, due date moves a month, the amount due
 *    resets to the regular payment); a smaller one just reduces the amount due.
 *    The streak only advances when the borrower was not already past due.
 */
export function applyPayment(user: User, request: PaymentRequest, result: PaymentResult): User {
  const currentBalance = result.projectedBalance ?? user.currentBalance;
  if (request.applyTo === 'PRINCIPAL') return { ...user, currentBalance };

  if (request.amount < user.nextPaymentAmount) {
    return {
      ...user,
      currentBalance,
      nextPaymentAmount: Math.round((user.nextPaymentAmount - request.amount) * 100) / 100,
    };
  }
  const wasPastDue = user.nextPaymentAmount > user.monthlyPayment;
  return {
    ...user,
    currentBalance,
    paymentsMade: user.paymentsMade + 1,
    onTimeStreak: wasPastDue ? user.onTimeStreak : user.onTimeStreak + 1,
    nextPaymentDate: addOneMonth(user.nextPaymentDate),
    nextPaymentAmount: Math.min(user.monthlyPayment, currentBalance),
  };
}

/** ISO date + 1 month, clamped to the target month's last day (Jan 31 -> Feb 28). */
function addOneMonth(iso: string): string {
  const d = parseIsoDate(iso);
  const first = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  const lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const next = new Date(first.getFullYear(), first.getMonth(), Math.min(d.getDate(), lastDay));
  const mm = String(next.getMonth() + 1).padStart(2, '0');
  const dd = String(next.getDate()).padStart(2, '0');
  return `${next.getFullYear()}-${mm}-${dd}`;
}

/** Reference format: PMT-YYYYMMDD-XXXXXX (uppercase alphanumeric). */
function generateReference(effectiveDate: string): string {
  const datePart = (effectiveDate || '').replace(/-/g, '') || 'PENDING';
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PMT-${datePart}-${suffix}`;
}
