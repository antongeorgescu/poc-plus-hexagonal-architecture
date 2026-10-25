/**
 * PORTS · DRIVING (inbound / primary) — AccountSummaryPort.
 * PURE TypeScript, ZERO @angular.
 *
 * A COGNITIVE driving port: the interface a driver calls to obtain a narrated
 * account summary. It is exposed by the core's cognitive region, on the same edge
 * of the hexagon as PaymentPort or LoanInfoPort — a driver cannot tell the two
 * regions apart, and cannot reach either one except through a port.
 *
 * The authoritative values below are produced by the DETERMINISTIC region; the
 * sentences merely phrase them.
 */
import { User } from '../../core/domain/user.entity';
import { BorrowerProfile } from '../../core/domain/borrower.entity';
import { LoanInfo } from '../../core/domain/loan.entity';
import { PaymentSnapshot } from '../../core/domain/payment.entity';

export interface AccountSummary {
  /** Authoritative — straight from ProfilePort. */
  profile: BorrowerProfile;
  /** Authoritative — straight from LoanInfoPort. */
  loan: LoanInfo;
  /** Authoritative — straight from PaymentPort. */
  payment: PaymentSnapshot;
  /** Narration only: phrases `profile` + `loan`, invents no number. */
  loanSentence: string;
  /** Narration only: phrases `payment`, invents no number. */
  paymentsSentence: string;
}

export interface AccountSummaryPort {
  summarize(user: User): Promise<AccountSummary>;
}
