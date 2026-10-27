/**
 * CONFIGURATION — The inquiry policy VALUES (a business setting, bound once).
 *
 * The core declares what it needs (`core/cognitive/inquiry.policy.ts`); this file
 * supplies it, and `providers.ts` injects it into `InquiryService`. The import
 * arrow points configuration → core, the same direction as every other binding
 * here: nothing in `core/` or `ports/` names this file.
 *
 * These are BUSINESS decisions, not technology: which topics are answered
 * identically for every borrower, what each topic is called, and what each one
 * means. A servicer may tune them per deployment — but no model can, at runtime
 * or otherwise. `InquiryService` still stamps the flag inside the core.
 */
import { InquiryCategory } from '../core/domain/inquiry.type';
import { InquiryPolicy } from '../core/cognitive/inquiry.policy';

/**
 * FIXED determinism policy — owned by the business, not the AI. It states which
 * categories are answered with the SAME components for every borrower.
 */
export const DETERMINISM_POLICY: Record<InquiryCategory, boolean> = {
  NEXT_PAYMENT: true,
  LOAN_BALANCE: true,
  EXTRA_PAYMENT: true,
  PROFILE_UPDATE: true,
  // Record look-ups: what the system of record already holds about this borrower.
  // Identical for every borrower by construction — same lists, same ordering.
  PAYMENT_HISTORY: true,
  PROFILE_HISTORY: true,
  // The program catalogue entry the loan financed: reference data, the same for every
  // borrower enrolled in it.
  PROGRAM_OF_STUDY: true,
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
export const CATEGORY_LABEL: Record<InquiryCategory, string> = {
  NEXT_PAYMENT: 'Next payment',
  LOAN_BALANCE: 'Loan balance & maturity',
  EXTRA_PAYMENT: 'Make a payment',
  PROFILE_UPDATE: 'Update your profile',
  PAYMENT_HISTORY: 'Payment history',
  PROFILE_HISTORY: 'Profile update history',
  PROGRAM_OF_STUDY: 'Program of study',
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
export const CATEGORY_DESCRIPTION: Record<InquiryCategory, string> = {
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
    'than to know. If they want to SEE payments already made, choose ' +
    'PAYMENT_HISTORY instead.',
  PROFILE_UPDATE:
    'Changing the contact details held on file — email address, phone number or ' +
    'mailing address — including after moving house. If they want to SEE ' +
    'changes already made, choose PROFILE_HISTORY instead.',
  PAYMENT_HISTORY:
    'A list of the payments the borrower has ALREADY made — past payments, ' +
    'payment records, receipts, transactions, what they have paid so far. The ' +
    'borrower wants to SEE what was paid, not to make a payment (EXTRA_PAYMENT) ' +
    'and not to know about the upcoming instalment (NEXT_PAYMENT).',
  PROFILE_HISTORY:
    'A list of the changes ALREADY made to the contact details on file — ' +
    'earlier email, phone or mailing-address updates and when they happened. ' +
    'The borrower wants to SEE past updates, not to make a new one ' +
    '(PROFILE_UPDATE).',
  PROGRAM_OF_STUDY:
    'Details of the program of study the loan financed — its name, code, field, ' +
    'credential, length, tuition and whether it includes co-op terms. The borrower ' +
    'wants to know WHAT they studied or are studying, not what they owe ' +
    '(LOAN_BALANCE) and not job openings for it (HARDSHIP).',
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

/** The bundle handed to `InquiryService` at construction. */
export const INQUIRY_POLICY: InquiryPolicy = {
  determinism: DETERMINISM_POLICY,
  labels: CATEGORY_LABEL,
  descriptions: CATEGORY_DESCRIPTION,
};
