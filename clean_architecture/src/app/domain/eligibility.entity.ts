/**
 * DOMAIN — Rate-relief eligibility (enterprise decision + money math).
 * PURE TypeScript, ZERO @angular. The eligibility OUTCOME is decided here, in
 * the core — never by the CLL/AI, which may only phrase the result.
 */
import { User } from './user.entity';

export interface RateReliefOutcome {
  eligible: boolean;
  proposedRate: number;
  estimatedMonthlySavings: number;
  reason: string;
}

/**
 * Deterministic eligibility check for a "new child" interest-rate relief
 * program. Rules are synthetic but deterministic so demos are repeatable.
 */
export function checkRateReliefEligibility(user: User): RateReliefOutcome {
  const reduction = user.userType === 1 ? 0.75 : user.userType === 2 ? 0.5 : 0.35;
  const proposedRate = Math.max(0, user.interestRate - reduction);

  // Synthetic amortization delta for messaging (authoritative money math).
  const oldMonthlyInterest = (user.currentBalance * (user.interestRate / 100)) / 12;
  const newMonthlyInterest = (user.currentBalance * (proposedRate / 100)) / 12;
  const estimatedMonthlySavings =
    Math.round((oldMonthlyInterest - newMonthlyInterest) * 100) / 100;

  const eligible = user.userType !== 3 || user.paymentsMade >= 6;
  const reason = eligible
    ? 'A qualifying life event (new dependent) was detected and your account meets the program requirements.'
    : 'Your account is currently past due. Clearing the outstanding balance unlocks eligibility for the new-child rate relief.';

  return { eligible, proposedRate, estimatedMonthlySavings, reason };
}
