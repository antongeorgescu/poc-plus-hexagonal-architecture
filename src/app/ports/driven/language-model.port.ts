/**
 * PORTS · DRIVEN (outbound / secondary) — LanguageModelPort.
 * PURE TypeScript, ZERO @angular.
 *
 * The core's cognitive region drives the model runtime through THIS interface —
 * the LLM / vector store is a technology behind a port, exactly like the SQLite
 * file behind UserRepositoryPort. Swap the adapter (server keyword model → hosted LLM → self-hosted)
 * and nothing inside the hexagon changes.
 *
 * The contract is deliberately narrow: the model produces WORDS and PROPOSALS.
 * It never receives an authoritative computation to perform, and every value it
 * is handed has already been computed by the deterministic region.
 *
 * ASYNC BY CONTRACT: every method returns a Promise. A model runtime is remote
 * I/O — the moment the adapter behind this port is a hosted service rather than
 * an in-process function, the call has latency and can fail. Declaring that in the
 * PORT (not in one adapter) is what actually keeps adapters swappable: the server keyword
 * model and Azure satisfy the same shape, so the composition root chooses between them
 * and nothing inside the hexagon knows which one it got.
 */
import { InquiryCategory } from '../../core/domain/inquiry.type';
import { SentimentLabel } from '../../core/domain/sentiment.type';
import { User } from '../../core/domain/user.entity';
import { BorrowerProfile } from '../../core/domain/borrower.entity';
import { LoanInfo } from '../../core/domain/loan.entity';
import { PaymentSnapshot } from '../../core/domain/payment.entity';

/** Welcome copy — prose only; the cognitive region adds the theme policy. */
/**
 * A category offered to the model for semantic matching: the label to return
 * plus a business-owned description of what the topic MEANS.
 *
 * Declared on this port because this port is its only consumer. The
 * descriptions themselves are authored in the core
 * (`core/cognitive/inquiry.service.ts`) and travel with each request, so no
 * adapter holds a copy of the taxonomy.
 */
export interface CategoryDescriptor {
  category: InquiryCategory;
  description: string;
}

export interface WelcomeCopy {
  greeting: string;
  question: string;
  suggestions: string[];
}

export interface LanguageModelPort {
  /**
   * PROPOSE a topic for free text, or null when nothing matches. The cognitive
   * region decides what a proposal is allowed to mean.
   *
   * `candidates` carries each selectable category together with a business-owned
   * description of the topic. A semantic adapter matches the borrower's wording
   * against those descriptions; a keyword adapter is free to ignore them
   * entirely. Either way the CORE owns the taxonomy and its meanings — the
   * adapter never holds its own copy of the category list.
   */
  classifyInquiry(
    text: string,
    candidates: readonly CategoryDescriptor[]
  ): Promise<InquiryCategory | null>;

  /** Phrase an ALREADY-COMPUTED loan fact set. Words only — no arithmetic. */
  narrateLoan(profile: BorrowerProfile, loan: LoanInfo): Promise<string>;

  /** Phrase an ALREADY-COMPUTED payment snapshot. Words only — no arithmetic. */
  narratePayments(payment: PaymentSnapshot): Promise<string>;

  /** Supportive blurb for a sentiment band the cognitive region already chose. */
  describeTone(label: SentimentLabel): Promise<string>;

  /** Greeting, invitation and suggested prompts for a borrower's persona. */
  composeWelcome(user: User): Promise<WelcomeCopy>;
}
