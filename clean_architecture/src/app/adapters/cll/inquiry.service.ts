/**
 * ADAPTERS · CLL — Cognitive Logic Layer (a plug-in "detail" on the outer ring).
 *
 * The CLL PROPOSES; the core DISPOSES. This service only *classifies* free text
 * into a category and *proposes* which answer component to show. Every
 * authoritative value (money, eligibility) is obtained elsewhere through the
 * deterministic use-case ports — never computed here.
 *
 * The `deterministic` flag is set from a FIXED business policy map below, NOT
 * decided by any AI. Classification mirrors the ntier keyword classifier.
 */
import { InquiryCategory, InquiryResult, JobPosting } from '../../domain/inquiry';
import { User } from '../../domain/user.entity';
import { KnowledgeBasePort } from '../../application/ports/knowledge-base.port';

interface CategoryRule {
  category: InquiryCategory;
  label: string;
  keywords: RegExp[];
}

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

export class InquiryService {
  constructor(private readonly knowledgeBase: KnowledgeBasePort) {}

  private rules: CategoryRule[] = [
    {
      // Must precede LOAN_BALANCE so "...to my loan balance" doesn't match balance first.
      category: 'EXTRA_PAYMENT',
      label: 'Make a payment',
      keywords: [
        /extra payment/i,
        /make an? (extra |additional )?payment/i,
        /additional payment/i,
        /pay(ing)? (extra|more|down|off early|ahead)/i,
        /lump sum/i,
        /principal/i,
      ],
    },
    {
      category: 'PROFILE_UPDATE',
      label: 'Update your profile',
      keywords: [
        /update (my )?(profile|contact|email|phone|mailing|address|information|info|details)/i,
        /change (my )?(email|phone|mailing|address|contact|profile)/i,
        /(update|change|edit|fix).*(contact|profile|details)/i,
        /new (email|phone|mailing|address)/i,
        /email address/i,
        /phone number/i,
        /mailing address/i,
        /i (just )?moved/i,
      ],
    },
    {
      category: 'NEXT_PAYMENT',
      label: 'Next payment',
      keywords: [/next payment/i, /due/i, /when.*(pay|payment)/i, /how much.*pay/i],
    },
    {
      category: 'LOAN_BALANCE',
      label: 'Loan balance & maturity',
      keywords: [/balance/i, /maturity/i, /payoff/i, /pay ?off/i, /how much.*owe/i],
    },
    {
      category: 'HARDSHIP',
      label: 'Payment hardship',
      keywords: [
        /lost my job/i,
        /unemploy/i,
        /can'?t (make|afford)/i,
        /cannot (make|afford)/i,
        /miss.*payment/i,
        /struggl/i,
        /hardship/i,
        /laid off/i,
      ],
    },
    {
      category: 'LIFE_EVENT',
      label: 'Life event & rate relief',
      keywords: [
        /child/i,
        /baby/i,
        /born/i,
        /newborn/i,
        /interest rate relief/i,
        /rate relief/i,
        /qualify/i,
        /married/i,
        /relief/i,
      ],
    },
  ];

  classify(text: string): InquiryResult {
    for (const rule of this.rules) {
      if (rule.keywords.some((k) => k.test(text))) {
        return {
          category: rule.category,
          deterministic: DETERMINISM_POLICY[rule.category],
          label: rule.label,
        };
      }
    }
    return {
      category: 'GENERAL',
      deterministic: DETERMINISM_POLICY['GENERAL'],
      label: 'General help',
    };
  }

  /** Grounding pass-through — reads the KB gateway (never a system of record). */
  getJobsForProgram(user: User): JobPosting[] {
    return this.knowledgeBase.getJobsForProgram(
      user.programOfStudy,
      `${user.city}, ${user.state}`
    );
  }
}
