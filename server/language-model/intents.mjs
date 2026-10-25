// The keyword registry: what each inquiry topic sounds like. This is the ONLY place to
// edit when a question lands on the wrong card — keyword-router.mjs just applies it.
//
// Reading an entry
//   terms      [keyword, weight]   evidence FOR the topic.   5 = a phrase that all but names
//                                  it, 3–4 = a strong hint, 1–2 = weak support.
//   negative   [keyword, weight]   evidence AGAINST it (subtracted).
//   patterns   [regex, weight]     escape hatch, matched against the STEMMED text.
//   priority   breaks an exact tie; the higher number wins.
//
// Keyword syntax (see keyword-router.mjs):   "*" = up to three other words,   "a|b" = either.
// Words are stemmed, so write them naturally: "payment" also catches "payments".
//
// The topic names must match InquiryCategory in src/app/core/domain/inquiry.type.ts. The core
// decides which topics are selectable (it sends them with every request) and what each one
// is allowed to mean; this file only decides which words point at which topic.

const HISTORY_CUE = ['history', 'previous', 'prior', 'earlier', 'receipt'];

export const INTENTS = {
  // ------------------------------------------------------------ record look-ups
  PAYMENT_HISTORY: {
    priority: 100,
    terms: [
      ['payment history', 5], ['payment record', 5], ['payment log', 5], ['payment ledger', 5],
      ['payment activity', 5], ['transaction history', 5], ['transaction list', 5], ['receipt', 5],
      ['what payment * made', 5], ['what have i paid', 5], ['what i paid', 5], ['what did i pay', 5],
      ['paid so far', 4], ['past payment', 4], ['previous payment', 4], ['prior payment', 4],
      ['earlier payment', 4], ['recent payment', 4], ['last payment', 4], ['latest payment', 4],
      ['history of * payment', 4], ['payment i * made', 4],
      ['show|list|view|see|display * payment', 2],
    ],
  },

  PROFILE_HISTORY: {
    priority: 99,
    terms: [
      ['profile|contact|email|phone|address * history', 5], ['update history', 5],
      ['change history', 5], ['audit trail', 5],
      ['what have i changed', 6], ['what i changed', 6], ['what have i updated', 6], ['what i updated', 6],
      ['history of * profile', 4], ['history of * contact', 4], ['history of * email', 4],
      ['history of * phone', 4], ['history of * address', 4],
      ['previous|past|earlier|prior|recent * update|change', 4],
      ['update|change ive|i * made', 4],
      ['show|view|see|list|display * profile|contact * update|change|history', 4],
    ],
  },

  // ------------------------------------------------------------------ actions
  EXTRA_PAYMENT: {
    priority: 90,
    terms: [
      ['extra payment', 5], ['additional payment', 5],
      ['make a|an|another|one|some * payment', 5],
      ['lump sum', 4], ['pay extra', 4], ['pay * extra', 4], ['pay more', 4], ['pay down', 4],
      ['pay ahead', 4], ['pay off early', 4], ['principal', 4],
    ],
    negative: [
      ...HISTORY_CUE.map((w) => [w, 4]), ['past', 4],
      ['cant', 5], ['cannot', 5], ['unable', 5], ['not * able', 5],
    ],
  },

  PROFILE_UPDATE: {
    priority: 80,
    terms: [
      ['update * profile', 5], ['update * contact', 5], ['update * email', 5], ['update * phone', 5],
      ['update * address', 5], ['update * information', 5], ['update * detail', 5],
      ['change * email', 5], ['change * phone', 5], ['change * address', 5],
      ['change * contact', 5], ['change * profile', 5], ['edit * profile', 5], ['edit * contact', 5],
      ['edit * detail', 5], ['fix * contact', 5],
      ['new email', 5], ['new phone', 5], ['new address', 5], ['new mailing', 5], ['i * moved', 5],
      ['email address', 3], ['phone number', 3], ['mailing address', 3],
    ],
    negative: [...HISTORY_CUE.map((w) => [w, 4]), ['past', 4], ['audit', 4]],
  },

  // ------------------------------------------------------------ guidance topics
  REPAYMENT_OPTIONS: {
    priority: 70,
    terms: [
      ['pay * off * faster|sooner|quicker|early', 5],
      ['finish|done paying|repaying * sooner|faster|early', 5],
      ['how fast|soon|quickly can i pay|repay', 5],
      ['how much * extra', 5], ['what if i pay|paid more|extra', 5],
      ['repayment assistance', 5], ['payment assistance', 5], ['assistance program', 5],
      ['repayment option', 5], ['lower * rate', 5], ['reduce * rate', 5], ['rate reduction', 5],
      ['shorten * term', 4], ['shorten * timeline', 4], ['reduce|cut * term|timeline', 4],
      ['how much more', 4], ['refinance', 4], ['repayment plan', 4],
      ['condition|requirement|criteria * relief|assistance', 4],
      ['relief * condition|requirement|criteria', 4],
      ['loyalty reward', 3],
    ],
  },

  // ----------------------------------------------------------------- questions
  NEXT_PAYMENT: {
    priority: 60,
    terms: [
      ['next payment', 5], ['next installment', 5], ['upcoming payment', 5], ['amount due', 5],
      ['payment due', 5], ['next bill', 5], ['due date', 4],
      ['due', 3], ['when * payment', 3], ['when * pay', 3], ['how much * pay', 3], ['how much * to pay', 3],
    ],
    negative: HISTORY_CUE.map((w) => [w, 4]),
  },

  LOAN_BALANCE: {
    priority: 50,
    terms: [
      ['loan balance', 5], ['how much * owe', 5], ['what do i owe', 5], ['what i owe', 5],
      ['maturity date', 5], ['outstanding balance', 5], ['payoff amount', 5],
      ['balance', 4], ['maturity', 4], ['mature', 4], ['payoff', 4],
      ['pay off', 3], ['outstanding', 3], ['interest rate', 3],
    ],
  },

  HARDSHIP: {
    priority: 40,
    terms: [
      ['lost * job', 6], ['laid off', 6], ['unable to pay', 6], ['unable to make', 6],
      ['not * able * make * payment', 6],
      ['cant afford', 5], ['cannot afford', 5], ['cant make', 5], ['cannot make', 5],
      ['cant pay', 5], ['cannot pay', 5], ['hardship', 5], ['unemployed', 5], ['unemployment', 5],
      ['miss * payment', 5],
      ['struggling', 4], ['financial difficulty', 4], ['financial trouble', 4],
      ['behind on * payment', 4], ['fall behind', 4], ['not be able', 4],
    ],
  },

  LIFE_EVENT: {
    priority: 30,
    terms: [
      ['interest rate relief', 5], ['rate relief', 5],
      ['child', 4], ['children', 4], ['baby', 4], ['born', 4], ['newborn', 4], ['pregnant', 4],
      ['pregnancy', 4], ['married', 4], ['marriage', 4], ['wedding', 4],
      ['return|returning|back to school', 4], ['return to study', 4],
      ['life event', 5], ['personal event', 4], ['family event', 4], ['major event', 4],
      ['life|major|family change', 4], ['life|personal circumstance', 4],
      ['relief', 3], ['qualify', 3],
    ],
    // Abstract / hypothetical framing: "if something should hinder my ability to pay…"
    patterns: [
      [/\b(?:in case|if|should)\b(?: [a-z0-9]+){0,12} (?:hinder|affect|impact|prevent)(?: [a-z0-9]+){0,8} (?:pay|ability)\b/, 4],
    ],
  },
};
