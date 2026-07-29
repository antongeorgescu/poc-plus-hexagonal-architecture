/**
 * CORE · COGNITIVE — Cognitive Logic Layer. It PROPOSES; it does not decide.
 * PURE TypeScript, ZERO @angular.
 *
 * This service implements InquiryPort, a cognitive DRIVING port on the same edge
 * of the hexagon as PaymentPort. It is inside the core because what it holds is
 * POLICY, not technology: the fixed determinism map and the topic labels are
 * business rules. The model — which merely *proposes* a category — sits outside,
 * behind LanguageModelPort. Grounding likewise arrives through KnowledgeBasePort.
 *
 * The `deterministic` flag is therefore set by the business, NOT by any AI: even
 * if the model proposes a wrong category, it cannot promote a topic to
 * deterministic or demote one out of it.
 */
import { InquiryCategory, InquiryResult, JobPosting } from '../domain/inquiry';
import { User } from '../domain/user.entity';
import { InquiryPort } from '../../ports/driving/inquiry.port';
import { LanguageModelPort } from '../../ports/driven/language-model.port';
import { KnowledgeBasePort } from '../../ports/driven/knowledge-base.port';

/**
 * FIXED determinism policy — owned by the business, not the AI. It states which
 * categories are answered with the SAME components for every borrower.
 */
const DETERMINISM_POLICY: Record<InquiryCategory, boolean> = {
  NEXT_PAYMENT: true,
  LOAN_BALANCE: true,
  EXTRA_PAYMENT: true,
  PROFILE_UPDATE: true,
  HARDSHIP: false,
  LIFE_EVENT: false,
  GENERAL: false,
};

/** Business-owned topic labels (headers/breadcrumbs) — not model output. */
const CATEGORY_LABEL: Record<InquiryCategory, string> = {
  NEXT_PAYMENT: 'Next payment',
  LOAN_BALANCE: 'Loan balance & maturity',
  EXTRA_PAYMENT: 'Make a payment',
  PROFILE_UPDATE: 'Update your profile',
  HARDSHIP: 'Payment hardship',
  LIFE_EVENT: 'Life event & rate relief',
  GENERAL: 'General help',
};

export class InquiryService implements InquiryPort {
  constructor(
    private readonly languageModel: LanguageModelPort,
    private readonly knowledgeBase: KnowledgeBasePort
  ) {}

  classify(text: string): InquiryResult {
    // The model PROPOSES a category (or nothing); this layer decides what that
    // proposal is worth and stamps the fixed policy onto it.
    const category = this.languageModel.classifyInquiry(text) ?? 'GENERAL';

    return {
      category,
      deterministic: DETERMINISM_POLICY[category],
      label: CATEGORY_LABEL[category],
    };
  }

  /** Grounding pass-through — reads the KB driven port (never a system of record). */
  getJobsForProgram(user: User): JobPosting[] {
    return this.knowledgeBase.getJobsForProgram(
      user.programOfStudy,
      `${user.city}, ${user.state}`
    );
  }
}
