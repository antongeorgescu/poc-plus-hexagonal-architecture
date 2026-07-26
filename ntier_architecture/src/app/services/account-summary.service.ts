import { Injectable, inject } from '@angular/core';
import { User } from '../models/user.model';
import {
  UserProfileService,
  BorrowerProfile,
} from '../bll/user-profile.service';
import { LoanInfoService, LoanInfo } from '../bll/loan-info.service';
import { PaymentService, PaymentSnapshot } from '../bll/payment.service';

export interface AccountSummary {
  profile: BorrowerProfile;
  loan: LoanInfo;
  payment: PaymentSnapshot;
  /** Plain-English narration of the loan facts. */
  loanSentence: string;
  /** Plain-English narration of the payment facts. */
  paymentsSentence: string;
}

/**
 * CLL-style service — it does not decide anything. It gathers the deterministic
 * facts collected by the BLL services (UserProfileService, LoanInfoService,
 * PaymentService) and "sums them up" into a structured, plain-English summary.
 *
 * Every figure it phrases originates in a BLL service; the CLL only narrates.
 */
@Injectable({ providedIn: 'root' })
export class AccountSummaryService {
  private profiles = inject(UserProfileService);
  private loans = inject(LoanInfoService);
  private payments = inject(PaymentService);

  summarize(user: User): AccountSummary {
    const profile = this.profiles.getProfile(user);
    const loan = this.loans.getLoanInfo(user);
    const payment = this.payments.getPaymentSnapshot(user);

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
