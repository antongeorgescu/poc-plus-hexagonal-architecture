/**
 * ADAPTERS · DRIVEN — MockLanguageModel: implements LanguageModelPort.
 *
 * This is the SECONDARY adapter that stands in for the LLM runtime / vector
 * store. No AI call is made: classification is keyword matching and narration is
 * string templating. That is the point — the model is a *technology behind a
 * port*, so replacing this file with a real LLM adapter is a composition-root
 * change and nothing inside the hexagon moves.
 *
 * Note what this adapter is NOT allowed to do: every number it prints was handed
 * to it already computed by the deterministic region. It formats and phrases; it
 * never calculates a balance, a payoff, or an eligibility outcome.
 *
 * The methods are `async` purely to satisfy the port's async contract — nothing
 * here awaits anything. That is the point: the port is shaped by what the SLOWEST
 * plausible adapter needs, so an in-process stub and a hosted model are
 * interchangeable. This class is also the offline FALLBACK that
 * AzureAiLanguageModel delegates to whenever a live call fails, so the POC keeps
 * working with no credentials and no network.
 */
import { LanguageModelPort, WelcomeCopy } from '../../ports/driven/language-model.port';
import { InquiryCategory } from '../../core/domain/inquiry';
import { SentimentLabel } from '../../core/domain/sentiment';
import { User, UserType } from '../../core/domain/user.entity';
import { BorrowerProfile } from '../../core/domain/borrower.entity';
import { LoanInfo } from '../../core/domain/loan.entity';
import { parseIsoDate } from '../../core/domain/date';
import { PaymentSnapshot } from '../../core/domain/payment.entity';

interface CategoryRule {
  category: InquiryCategory;
  keywords: RegExp[];
}

export class MockLanguageModel implements LanguageModelPort {
  /**
   * Stand-in for intent detection. ORDER MATTERS: EXTRA_PAYMENT must precede
   * LOAN_BALANCE so "...extra payment to my loan balance" doesn't match balance
   * first. A real model would replace this list wholesale.
   */
  private readonly rules: CategoryRule[] = [
    {
      category: 'EXTRA_PAYMENT',
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
      // Scenario / qualifying-condition guidance. Must precede NEXT_PAYMENT and
      // LOAN_BALANCE: their /how much.*pay/ and /pay ?off/ are broad enough to
      // capture "how much extra to pay off faster", which is planning, not a
      // statement of the scheduled payment. Deliberately does NOT claim bare
      // /relief/ or /qualify/ — LIFE_EVENT owns those, and stealing them would
      // route new-child rate-relief questions to the wrong card.
      category: 'REPAYMENT_OPTIONS',
      keywords: [
        // (1) paying off faster
        /pay(ing)? (it |the loan |this )?off (faster|sooner|quicker|early)/i,
        /(finish|done) (paying|repaying).*(sooner|faster|early)/i,
        /(shorten|reduce|cut).*(term|timeline|repayment period)/i,
        /how (fast|soon|quickly) can I (pay|repay)/i,
        /how much (extra|more).*(pay|payment)/i,
        /(what|how).*if I (pay|paid) (more|extra)/i,
        // (2) repayment-assistance conditions
        /(repayment|payment) assistance/i,
        /assistance program/i,
        // (3) interest-relief conditions & scenarios
        /lower (my )?(interest )?rate/i,
        /reduce (my )?(interest )?rate/i,
        /rate reduction/i,
        /(condition|requirement|criteria)s?.*(relief|assistance)/i,
        /(relief|assistance).*(condition|requirement|criteria)/i,
      ],
    },
    {
      category: 'NEXT_PAYMENT',
      keywords: [/next payment/i, /due/i, /when.*(pay|payment)/i, /how much.*pay/i],
    },
    {
      category: 'LOAN_BALANCE',
      keywords: [/balance/i, /maturity/i, /payoff/i, /pay ?off/i, /how much.*owe/i],
    },
    {
      category: 'HARDSHIP',
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

  async classifyInquiry(text: string): Promise<InquiryCategory | null> {
    for (const rule of this.rules) {
      if (rule.keywords.some((k) => k.test(text))) return rule.category;
    }
    // No opinion. The cognitive region decides what "no match" means.
    return null;
  }

  async narrateLoan(profile: BorrowerProfile, loan: LoanInfo): Promise<string> {
    // Every figure below arrived pre-computed from LoanInfoPort.
    const years = Math.floor(loan.monthsToMaturity / 12);
    const rem = loan.monthsToMaturity % 12;
    const term =
      years > 0
        ? `${years} year${years === 1 ? '' : 's'}${rem ? ` and ${rem} month${rem === 1 ? '' : 's'}` : ''}`
        : `${rem} month${rem === 1 ? '' : 's'}`;
    const maturity = parseIsoDate(loan.maturityDate).toLocaleDateString(undefined, {
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

  async narratePayments(payment: PaymentSnapshot): Promise<string> {
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

  /** The band was chosen by the cognitive region; the model only writes the copy. */
  async describeTone(label: SentimentLabel): Promise<string> {
    const blurbs: Record<SentimentLabel, string> = {
      'Very positive':
        "Your conversations have been positive and engaged — thank you for staying in touch!",
      Positive: 'Your recent chats have had a friendly, constructive tone.',
      Neutral: "Things have felt matter-of-fact lately — we're here whenever you need us.",
      Negative:
        "We've noticed some frustration in recent chats. Let's find a plan that makes things easier.",
      'Very negative':
        "Recent conversations have felt stressful. You're not alone — a specialist can help you find relief today.",
    };
    return blurbs[label];
  }

  async composeWelcome(user: User): Promise<WelcomeCopy> {
    const name = user.firstName;
    const copy: Record<UserType, WelcomeCopy> = {
      1: {
        greeting: `Welcome back, ${name} — you're in excellent standing! 🎉`,
        question: `Thanks for being such a reliable borrower. How can we help you make the most of your account today?`,
        suggestions: [
          "I'd like to know when my next payment is due and its amount",
          "What's the balance of my loan and when's the maturity date?",
          'Do I qualify for a lower interest rate or loyalty rewards?',
        ],
      },
      2: {
        greeting: `Hi ${name}, good to see you.`,
        question: `We're here to help you stay on track. What can we help you with today?`,
        suggestions: [
          "I'd like to know when my next payment is due and its amount",
          "What's the balance of my loan and when's the maturity date?",
          'I may miss a few payments — what are my options?',
        ],
      },
      3: {
        greeting: `Hello ${name}, we're glad you're here.`,
        question: `We understand things can get tough, and we're here to help you find a path forward. How can we support you today?`,
        suggestions: [
          'I may not be able to make payments — I lost my job',
          'I just had my first child — do I qualify for interest rate relief?',
          "What's the balance of my loan and when's the maturity date?",
        ],
      },
    };
    return copy[user.userType];
  }

  private money(n: number): string {
    return n.toLocaleString(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    });
  }

  private date(iso: string): string {
    return parseIsoDate(iso).toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }
}
