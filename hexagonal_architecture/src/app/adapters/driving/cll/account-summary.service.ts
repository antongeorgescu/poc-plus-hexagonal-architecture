/**
 * ADAPTERS · DRIVING · CLL — Account summary. It NARRATES; it does not decide.
 *
 * SEAM: the CLL is just another PRIMARY adapter. It drives the core through the
 * SAME driving ports as the UI — ProfilePort + LoanInfoPort + PaymentPort — and
 * phrases the aggregate in plain English. It never computes money itself.
 * "The CLL proposes, the core disposes." Delete this adapter and every number
 * still computes correctly in the core.
 */
import { ProfilePort } from '../../../ports/driving/profile.port';
import { LoanInfoPort } from '../../../ports/driving/loan-info.port';
import { PaymentPort } from '../../../ports/driving/payment.port';
import { BorrowerProfile } from '../../../core/domain/borrower.entity';
import { LoanInfo } from '../../../core/domain/loan.entity';
import { PaymentSnapshot } from '../../../core/domain/payment.entity';
import { User } from '../../../core/domain/user.entity';

export interface AccountSummary {
  profile: BorrowerProfile;
  loan: LoanInfo;
  payment: PaymentSnapshot;
  loanSentence: string;
  paymentsSentence: string;
}

export class AccountSummaryService {
  constructor(
    private readonly profilePort: ProfilePort,
    private readonly loanInfoPort: LoanInfoPort,
    private readonly paymentPort: PaymentPort
  ) {}

  summarize(user: User): AccountSummary {
    // Authoritative values obtained ONLY through driving ports — never here.
    const profile = this.profilePort.getProfile(user);
    const loan = this.loanInfoPort.getLoanInfo(user);
    const payment = this.paymentPort.getSnapshot(user);

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
