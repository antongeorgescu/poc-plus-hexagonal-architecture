/**
 * ADAPTERS · CLL — Account summary. It NARRATES; it does not decide.
 *
 * The CLL proposes; the core disposes: every figure this service phrases is
 * obtained by calling the deterministic use cases (GetBorrowerProfile,
 * GetLoanInfo, GetPaymentSnapshot). It aggregates and writes plain English —
 * it never computes money itself. Delete this adapter and every number still
 * computes correctly in the core.
 */
import { GetBorrowerProfile } from '../../application/use-cases/get-borrower-profile.usecase';
import { GetLoanInfo } from '../../application/use-cases/get-loan-info.usecase';
import { GetPaymentSnapshot } from '../../application/use-cases/get-payment-snapshot.usecase';
import { BorrowerProfile } from '../../domain/borrower.entity';
import { LoanInfo } from '../../domain/loan.entity';
import { PaymentSnapshot } from '../../domain/payment.entity';
import { User } from '../../domain/user.entity';

export interface AccountSummary {
  profile: BorrowerProfile;
  loan: LoanInfo;
  payment: PaymentSnapshot;
  loanSentence: string;
  paymentsSentence: string;
}

export class AccountSummaryService {
  constructor(
    private readonly getBorrowerProfile: GetBorrowerProfile,
    private readonly getLoanInfo: GetLoanInfo,
    private readonly getPaymentSnapshot: GetPaymentSnapshot
  ) {}

  summarize(user: User): AccountSummary {
    // Authoritative values obtained ONLY through use cases — never computed here.
    const profile = this.getBorrowerProfile.execute(user);
    const loan = this.getLoanInfo.execute(user);
    const payment = this.getPaymentSnapshot.execute(user);

    return {
      profile,
      loan,
      payment,
      loanSentence: this.loanSentence(profile, loan),
      paymentsSentence: this.paymentsSentence(payment),
    };
  }

  private loanSentence(profile: BorrowerProfile, loan: LoanInfo): string {
    const years = Math.floor(loan.monthsToMaturity / 12);
    const rem = loan.monthsToMaturity % 12;
    const term =
      years > 0
        ? `${years} year${years === 1 ? '' : 's'}${rem ? ` and ${rem} month${rem === 1 ? '' : 's'}` : ''}`
        : `${rem} month${rem === 1 ? '' : 's'}`;
    const maturity = new Date(loan.maturityDate).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
    return (
      `You originally borrowed ${this.money(loan.originalAmount)} to fund your ` +
      `${profile.programOfStudy} studies. You currently owe ${this.money(loan.currentBalance)}, ` +
      `so you've paid off about ${loan.paidPercent}% of the loan at a ${loan.interestRate}% ` +
      `interest rate. At your current pace the loan is scheduled to be fully repaid by ` +
      `${maturity} — roughly ${term} from now.`
    );
  }

  private paymentsSentence(payment: PaymentSnapshot): string {
    const base =
      `Your regular monthly payment is ${this.money(payment.monthlyPayment)}, and you've made ` +
      `${payment.paymentsMade} payment${payment.paymentsMade === 1 ? '' : 's'} so far.`;

    let history: string;
    if (payment.paymentsMissed === 0) {
      history = ` You haven't missed a single payment — that's a ${payment.onTimeStreak}-payment on-time streak.`;
    } else {
      history =
        ` You've missed ${payment.paymentsMissed} payment${payment.paymentsMissed === 1 ? '' : 's'}` +
        (payment.onTimeStreak > 0
          ? `, but you're rebuilding momentum with ${payment.onTimeStreak} on-time payment${payment.onTimeStreak === 1 ? '' : 's'} in a row.`
          : ` and are not currently in an on-time streak.`);
    }

    const next = payment.isPastDue
      ? ` Your next scheduled amount is ${this.money(payment.nextPaymentAmount)} due ${this.date(payment.nextPaymentDate)}, ` +
        `which includes ${this.money(payment.pastDueAmount)} of past-due balance on top of your regular payment.`
      : ` Your next payment of ${this.money(payment.nextPaymentAmount)} is due ${this.date(payment.nextPaymentDate)}.`;

    return base + history + next;
  }

  private money(n: number): string {
    return n.toLocaleString(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    });
  }

  private date(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }
}
