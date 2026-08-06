/**
 * CORE · DOMAIN — Sentiment vocabulary shared by the cognitive region and the
 * ports on both sides of it. PURE TypeScript, ZERO @angular.
 *
 * A sentiment reading is a SIGNAL, never a decision: nothing in the deterministic
 * region reads it, and no money or eligibility outcome may depend on it.
 */
export type SentimentLabel =
  | 'Very positive'
  | 'Positive'
  | 'Neutral'
  | 'Negative'
  | 'Very negative';

export type SentimentTone = 'good' | 'warn' | 'bad';
