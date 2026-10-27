/**
 * CORE · DOMAIN — Entities (enterprise business rules).
 * PURE TypeScript. ZERO @angular imports. No framework, no DB, no AI.
 * This lives INSIDE the hexagon; nothing here names a port, a UI, or a driver.
 *
 * User type drives account standing and the UI theme.
 *   1 = Excellent standing (highly successful at paying)
 *   2 = Delinquency grade 1 (paying, but occasionally misses a payment)
 *   3 = Delinquency grade 2 (stopped paying)
 */
export type UserType = 1 | 2 | 3;

/**
 * The program of study a loan financed, from the program catalogue (program_of_study).
 * Reference data: the same program is the same for every borrower enrolled in it.
 */
export interface ProgramOfStudy {
  code: string; // catalogue code, e.g. 'CS-BSC'
  name: string; // what the borrower sees, e.g. 'Computer Science'
  fieldOfStudy: string; // broad grouping, e.g. 'Technology'
  credentialLevel: string; // e.g. "Bachelor's degree", 'Diploma'
  durationMonths: number;
  annualTuition: number;
  coOp: boolean; // true = the program includes paid work terms
  description: string;
}

/**
 * One borrower record, as a typed entity. The repository assembles it from the
 * borrower, loan, program_of_study, payment and user_authentication tables (one row per borrower).
 */
export interface User {
  username: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  programOfStudy: string; // = program.name, kept for the callers that only need the name
  program: ProgramOfStudy;
  city: string;
  province: string;
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
  // Editable contact details (see ProfileContact in borrower.entity.ts)
  email: string;
  phone: string;
  mailingAddress: string;
}

export const USER_TYPE_LABEL: Record<UserType, string> = {
  1: 'Excellent Standing',
  2: 'Delinquency Grade 1',
  3: 'Delinquency Grade 2',
};
