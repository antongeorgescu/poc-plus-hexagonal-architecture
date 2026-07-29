/**
 * CORE · COGNITIVE — Account summary. It NARRATES; it does not decide.
 * PURE TypeScript, ZERO @angular.
 *
 * SEAM: this service lives INSIDE the hexagon because it is application logic —
 * it owns the aggregation policy (which three facts make a summary). What it does
 * NOT own is technology: the prose comes from the LanguageModelPort and every
 * figure comes from the deterministic region's DRIVING ports — the same doors the
 * UI uses, with no privileged path.
 *
 * "The CLL proposes, the BLL disposes." Delete this whole cognitive region and
 * every number still computes correctly on the deterministic side.
 */
import { AccountSummary, AccountSummaryPort } from '../../ports/driving/account-summary.port';
import { ProfilePort } from '../../ports/driving/profile.port';
import { LoanInfoPort } from '../../ports/driving/loan-info.port';
import { PaymentPort } from '../../ports/driving/payment.port';
import { LanguageModelPort } from '../../ports/driven/language-model.port';
import { User } from '../domain/user.entity';

export class AccountSummaryService implements AccountSummaryPort {
  constructor(
    private readonly profilePort: ProfilePort,
    private readonly loanInfoPort: LoanInfoPort,
    private readonly paymentPort: PaymentPort,
    private readonly languageModel: LanguageModelPort
  ) {}

  summarize(user: User): AccountSummary {
    // Authoritative values obtained ONLY through the deterministic driving ports.
    const profile = this.profilePort.getProfile(user);
    const loan = this.loanInfoPort.getLoanInfo(user);
    const payment = this.paymentPort.getSnapshot(user);

    return {
      profile,
      loan,
      payment,
      // Phrasing delegated to the model port — it words, it does not compute.
      loanSentence: this.languageModel.narrateLoan(profile, loan),
      paymentsSentence: this.languageModel.narratePayments(payment),
    };
  }
}
