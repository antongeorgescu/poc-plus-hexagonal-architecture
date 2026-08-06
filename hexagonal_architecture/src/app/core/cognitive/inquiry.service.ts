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
import { InquiryCategory } from '../domain/inquiry.type';
import { JobPosting } from '../domain/job-posting.type';
import { User } from '../domain/user.entity';
import { InquiryPort, InquiryResult } from '../../ports/driving/inquiry.port';
import {
  CategoryDescriptor,
  LanguageModelPort,
} from '../../ports/driven/language-model.port';
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
  // Scenario & qualifying-condition guidance: paying off faster, what the
  // repayment-assistance programs require, and what interest relief takes.
  // COGNITIVE by nature — it explains levers and conditions. Every figure it
  // shows is still fetched from a deterministic port, and the actual
  // eligibility verdict remains EligibilityPort's to give.
  REPAYMENT_OPTIONS: false,
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
  REPAYMENT_OPTIONS: 'Repayment options & scenarios',
  GENERAL: 'General help',
};

/**
 * Business-owned MEANING of each topic. This is the signal a semantic classifier
 * matches the borrower's wording against, so it belongs here beside the labels
 * and the determinism policy — not inside a prompt string in an adapter.
 *
 * Write these as discriminators, not definitions: each one should say what makes
 * the topic different from its nearest neighbour, because that is the decision
 * the model is actually being asked to make.
 */
const CATEGORY_DESCRIPTION: Record<InquiryCategory, string> = {
  NEXT_PAYMENT:
    'The amount and due date of the single upcoming instalment. The borrower is ' +
    'asking when to pay next and how much — not about the total owed.',
  LOAN_BALANCE:
    'What is currently owed and when the loan ends: outstanding balance, payoff ' +
    'amount, interest rate, proportion repaid, maturity date. The borrower is ' +
    'ASKING about figures, not trying to pay anything.',
  EXTRA_PAYMENT:
    'The borrower wants to MAKE a payment now — an extra or additional payment, ' +
    'paying down principal, or a lump sum. An intention to act, not an enquiry. ' +
    'Choose this over LOAN_BALANCE whenever the borrower wants to pay rather ' +
    'than to know.',
  PROFILE_UPDATE:
    'Changing the contact details held on file — email address, phone number or ' +
    'mailing address — including after moving house.',
  HARDSHIP:
    'The borrower is in financial distress or fears it: job loss, cannot afford ' +
    'the payments, expects to miss payments, or is asking what help exists. The ' +
    'defining signal is present or imminent inability to pay.',
  LIFE_EVENT:
    'A personal life event that may change what the borrower is entitled to — a ' +
    'new child, marriage, or returning to study — usually asked as whether the ' +
    'event qualifies them for relief. Also covers ABSTRACT or HYPOTHETICAL ' +
    'framing, where no specific event is named: "if a personal event affects my ' +
    'ability to pay, what help is there?". Choose this over REPAYMENT_OPTIONS ' +
    'whenever a life event is mentioned, and HARDSHIP instead if the borrower ' +
    'says they cannot pay right now.',
  REPAYMENT_OPTIONS:
    'Exploring scenarios and qualifying conditions while NOT in distress: how to ' +
    'pay the loan off faster, how much extra that would take, what repayment ' +
    'assistance requires, or what it takes to obtain an interest-rate reduction. ' +
    'Choose HARDSHIP instead if the borrower says they cannot pay.',
  GENERAL:
    'Anything that does not clearly match another topic. Never offered to the ' +
    'classifier as a choice — it is what the core falls back to when the model ' +
    'declines to match.',
};

/**
 * What the classifier may choose from. GENERAL is deliberately EXCLUDED: it is
 * the absence of a match, not a match. Offering it would let the model "pick"
 * the fallback and destroy the distinction between a proposal and an abstention,
 * which is the signal this layer relies on.
 */
const MATCHABLE_CATEGORIES: readonly CategoryDescriptor[] = (
  Object.keys(CATEGORY_DESCRIPTION) as InquiryCategory[]
)
  .filter((c) => c !== 'GENERAL')
  .map((category) => ({ category, description: CATEGORY_DESCRIPTION[category] }));

export class InquiryService implements InquiryPort {
  constructor(
    private readonly languageModel: LanguageModelPort,
    private readonly knowledgeBase: KnowledgeBasePort
  ) {}

  async classify(text: string): Promise<InquiryResult> {
    // The model PROPOSES a category (or nothing); this layer decides what that
    // proposal is worth and stamps the fixed policy onto it. Awaiting a remote
    // model changes NOTHING about who decides: an unusable proposal still
    // collapses to GENERAL, and the determinism policy below is still ours.
    // The candidate list travels WITH the request, so the adapter never keeps a
     // copy of the taxonomy. A semantic adapter matches the wording against each
     // description; the keyword adapter ignores them. Either way an abstention
     // (null) collapses to GENERAL here, in the core.
    const category =
      (await this.languageModel.classifyInquiry(text, MATCHABLE_CATEGORIES)) ?? 'GENERAL';

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
