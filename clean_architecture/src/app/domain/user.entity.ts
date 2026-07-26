/**
 * DOMAIN — Entities (enterprise business rules).
 * PURE TypeScript. ZERO @angular imports. No framework, no DB, no AI.
 *
 * User type drives account standing and the UI theme.
 *   1 = Excellent standing (highly successful at paying)
 *   2 = Delinquency grade 1 (paying, but occasionally misses a payment)
 *   3 = Delinquency grade 2 (stopped paying)
 */
export type UserType = 1 | 2 | 3;

/** One borrower record (one row of assets/users.csv), parsed into a typed entity. */
export interface User {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  programOfStudy: string;
  city: string;
  state: string;
  originalAmount: number;
  currentBalance: number;
  interestRate: number; // annual %, e.g. 4.25
  monthlyPayment: number;
  nextPaymentDate: string; // ISO yyyy-mm-dd
  nextPaymentAmount: number;
  maturityDate: string; // ISO yyyy-mm-dd
  paymentsMade: number;
  paymentsMissed: number;
  onTimeStreak: number;
  creditScore: number;
}

export const USER_TYPE_LABEL: Record<UserType, string> = {
  1: 'Excellent Standing',
  2: 'Delinquency Grade 1',
  3: 'Delinquency Grade 2',
};
