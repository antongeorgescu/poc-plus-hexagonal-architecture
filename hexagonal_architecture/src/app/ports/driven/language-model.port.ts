/**
 * PORTS · DRIVEN (outbound / secondary) — LanguageModelPort.
 * PURE TypeScript, ZERO @angular.
 *
 * The core's cognitive region drives the model runtime through THIS interface —
 * the LLM / vector store is a technology behind a port, exactly like `users.csv`
 * behind UserRepositoryPort. Swap the adapter (mock → hosted LLM → self-hosted)
 * and nothing inside the hexagon changes.
 *
 * The contract is deliberately narrow: the model produces WORDS and PROPOSALS.
 * It never receives an authoritative computation to perform, and every value it
 * is handed has already been computed by the deterministic region.
 */
import { InquiryCategory } from '../../core/domain/inquiry';
import { SentimentLabel } from '../../core/domain/sentiment';
import { User } from '../../core/domain/user.entity';
import { BorrowerProfile } from '../../core/domain/borrower.entity';
import { LoanInfo } from '../../core/domain/loan.entity';
import { PaymentSnapshot } from '../../core/domain/payment.entity';

/** Welcome copy — prose only; the cognitive region adds the theme policy. */
export interface WelcomeCopy {
  greeting: string;
  question: string;
  suggestions: string[];
}

export interface LanguageModelPort {
  /**
   * PROPOSE a topic for free text, or null when nothing matches. The cognitive
   * region decides what a proposal is allowed to mean.
   */
  classifyInquiry(text: string): InquiryCategory | null;

  /** Phrase an ALREADY-COMPUTED loan fact set. Words only — no arithmetic. */
  narrateLoan(profile: BorrowerProfile, loan: LoanInfo): string;

  /** Phrase an ALREADY-COMPUTED payment snapshot. Words only — no arithmetic. */
  narratePayments(payment: PaymentSnapshot): string;

  /** Supportive blurb for a sentiment band the cognitive region already chose. */
  describeTone(label: SentimentLabel): string;

  /** Greeting, invitation and suggested prompts for a borrower's persona. */
  composeWelcome(user: User): WelcomeCopy;
}
