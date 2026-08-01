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

  async summarize(user: User): Promise<AccountSummary> {
    // Authoritative values obtained ONLY through the deterministic driving ports.
    // These are resolved BEFORE the model is called and are never sent back for
    // recomputation — the model receives finished numbers and returns prose.
    const profile = this.profilePort.getProfile(user);
    const loan = this.loanInfoPort.getLoanInfo(user);
    const payment = this.paymentPort.getSnapshot(user);

    // Two independent narrations — issue them together rather than in series.
    const [loanSentence, paymentsSentence] = await Promise.all([
      this.languageModel.narrateLoan(profile, loan),
      this.languageModel.narratePayments(payment),
    ]);

    return {
      profile,
      loan,
      payment,
      // Phrasing delegated to the model port — it words, it does not compute.
      loanSentence,
      paymentsSentence,
    };
  }
}
