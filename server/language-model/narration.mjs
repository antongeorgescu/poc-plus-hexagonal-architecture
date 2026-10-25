// Server-side stand-in for the language model's WORDS: string templates over figures that
// arrive already computed. Nothing here calculates a balance, a payoff or an eligibility
// outcome — it only phrases what the Angular core hands it (computed values in, words out).
// Ported from the former in-browser MockLanguageModel.

const LOCALE = 'en-US';

const money = (n) =>
  Number(n).toLocaleString(LOCALE, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

/** Parse yyyy-MM-dd as a LOCAL calendar date, so the day never shifts across timezones. */
function parseIsoDate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, m - 1, d);
}

const longDate = (iso) =>
  parseIsoDate(iso).toLocaleDateString(LOCALE, { month: 'long', day: 'numeric', year: 'numeric' });

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function narrateLoan(profile, loan) {
  const years = Math.floor(loan.monthsToMaturity / 12);
  const rem = loan.monthsToMaturity % 12;
  const term =
    years > 0
      ? `${plural(years, 'year')}${rem ? ` and ${plural(rem, 'month')}` : ''}`
      : plural(rem, 'month');
  const maturity = parseIsoDate(loan.maturityDate).toLocaleDateString(LOCALE, {
    month: 'long',
    year: 'numeric',
  });
  return (
    `You originally borrowed ${money(loan.originalAmount)} to fund your ` +
    `${profile.programOfStudy} studies. You currently owe ${money(loan.currentBalance)}, ` +
    `so you've paid off about ${loan.paidPercent}% of the loan at a ${loan.interestRate}% ` +
    `interest rate. At your current pace the loan is scheduled to be fully repaid by ` +
    `${maturity} — roughly ${term} from now.`
  );
}

export function narratePayments(payment) {
  const base =
    `Your regular monthly payment is ${money(payment.monthlyPayment)}, and you've made ` +
    `${plural(payment.paymentsMade, 'payment')} so far.`;

  let history;
  if (payment.paymentsMissed === 0) {
    history = ` You haven't missed a single payment — that's a ${payment.onTimeStreak}-payment on-time streak.`;
  } else {
    history =
      ` You've missed ${plural(payment.paymentsMissed, 'payment')}` +
      (payment.onTimeStreak > 0
        ? `, but you're rebuilding momentum with ${plural(payment.onTimeStreak, 'on-time payment')} in a row.`
        : ` and are not currently in an on-time streak.`);
  }

  const next = payment.isPastDue
    ? ` Your next scheduled amount is ${money(payment.nextPaymentAmount)} due ${longDate(payment.nextPaymentDate)}, ` +
      `which includes ${money(payment.pastDueAmount)} of past-due balance on top of your regular payment.`
    : ` Your next payment of ${money(payment.nextPaymentAmount)} is due ${longDate(payment.nextPaymentDate)}.`;

  return base + history + next;
}

const TONE_BLURBS = {
  'Very positive': 'Your conversations have been positive and engaged — thank you for staying in touch!',
  Positive: 'Your recent chats have had a friendly, constructive tone.',
  Neutral: "Things have felt matter-of-fact lately — we're here whenever you need us.",
  Negative: "We've noticed some frustration in recent chats. Let's find a plan that makes things easier.",
  'Very negative': "Recent conversations have felt stressful. You're not alone — a specialist can help you find relief today.",
};

/** The band was chosen by the Angular core; this only writes the copy. */
export function describeTone(label) {
  return TONE_BLURBS[label] ?? null;
}

const SHARED = {
  next: "I'd like to know when my next payment is due and its amount",
  balance: "What's the balance of my loan and when's the maturity date?",
};

export function composeWelcome({ firstName, userType }) {
  const copy = {
    1: {
      greeting: `Welcome back, ${firstName} — you're in excellent standing! 🎉`,
      question: 'Thanks for being such a reliable borrower. How can we help you make the most of your account today?',
      suggestions: [SHARED.next, SHARED.balance, 'Do I qualify for a lower interest rate or loyalty rewards?'],
    },
    2: {
      greeting: `Hi ${firstName}, good to see you.`,
      question: "We're here to help you stay on track. What can we help you with today?",
      suggestions: [SHARED.next, SHARED.balance, 'I may miss a few payments — what are my options?'],
    },
    3: {
      greeting: `Hello ${firstName}, we're glad you're here.`,
      question: "We understand things can get tough, and we're here to help you find a path forward. How can we support you today?",
      suggestions: [
        'I may not be able to make payments — I lost my job',
        'I just had my first child — do I qualify for interest rate relief?',
        SHARED.balance,
      ],
    },
  };
  return copy[userType] ?? null;
}
