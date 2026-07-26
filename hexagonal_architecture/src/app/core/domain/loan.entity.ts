/**
 * CORE · DOMAIN — Loan entity (enterprise money math). PURE TypeScript, ZERO @angular.
 * This is the authoritative source for loan arithmetic. A driving adapter (UI or
 * CLL) may narrate these numbers but structurally cannot compute them.
 */
import { User } from './user.entity';

export interface LoanInfo {
  originalAmount: number;
  currentBalance: number;
  interestRate: number;
  maturityDate: string;
  /** Whole-percent of the original principal already repaid (0..100). */
  paidPercent: number;
  /** Whole months remaining until maturity (never negative). */
  monthsToMaturity: number;
}

/** Whole-percent of the original principal already repaid (0..100). */
export function paidPercent(user: User): number {
  if (!user.originalAmount) return 0;
  const paid = (user.originalAmount - user.currentBalance) / user.originalAmount;
  return Math.max(0, Math.min(100, Math.round(paid * 100)));
}

/** Whole months remaining until maturity (never negative). */
export function monthsToMaturity(maturityDate: string): number {
  const now = new Date();
  const maturity = new Date(maturityDate);
  const months =
    (maturity.getFullYear() - now.getFullYear()) * 12 +
    (maturity.getMonth() - now.getMonth());
  return Math.max(0, months);
}

/** Assemble the deterministic loan snapshot for a borrower. */
export function buildLoanInfo(user: User): LoanInfo {
  return {
    originalAmount: user.originalAmount,
    currentBalance: user.currentBalance,
    interestRate: user.interestRate,
    maturityDate: user.maturityDate,
    paidPercent: paidPercent(user),
    monthsToMaturity: monthsToMaturity(user.maturityDate),
  };
}
