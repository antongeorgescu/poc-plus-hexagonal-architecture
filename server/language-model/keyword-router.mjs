// A small, dependency-free keyword router: free text in, a topic out — no LLM.
//
// It is a framework, not a list of regexes: the topics and their keywords are DATA (see
// intents.mjs); this file only knows how to normalise text, compile terms, score topics
// and explain the result. Adding or tuning a topic never touches this file.
//
// How a question is classified
//   1. normalise  lower-case, drop apostrophes ("can't" -> "cant"), strip punctuation, and
//                 reduce every word to a crude stem ("payments" -> "payment", "changed" ->
//                 "chang"), so one keyword covers its plurals and tenses.
//   2. match      every keyword a topic declares is a compiled pattern over the stemmed text.
//                 "*" lets up to three other words sit in between ("pay * off"), and "a|b"
//                 accepts either word ("faster|sooner").
//   3. score      a topic's score is the sum of the weights of its distinct matched keywords,
//                 minus the weights of its matched "negative" keywords.
//   4. decide     the highest score wins if it reaches MIN_SCORE; a tie goes to the topic with
//                 the higher declared priority; nothing above the bar means "no opinion".
// Every decision comes back with the scores and the keywords behind them, so it can be
// explained (and tested) rather than guessed at.

/** A topic needs at least this much evidence before it is proposed. */
export const MIN_SCORE = 3;

/** How many words a "*" may stand for. */
const MAX_GAP = 3;

/** Lower-case, drop apostrophes, replace anything that is not a letter/digit with a space. */
export function normalize(text) {
  return String(text)
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * A deliberately crude stemmer. It does not need to be linguistically right, only
 * CONSISTENT: the same function runs over the borrower's words and over every keyword,
 * so "changes", "changed" and "change" all meet at "chang".
 */
export function stem(word) {
  let w = word;
  if (w.length <= 3) return w;
  if (w.length > 4 && w.endsWith('ies')) w = w.slice(0, -3) + 'y';
  else if (w.length > 4 && w.endsWith('ied')) w = w.slice(0, -3) + 'y';
  else if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2);
  else if (w.length > 4 && w.endsWith('es')) w = w.slice(0, -2);
  else if (w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us')) w = w.slice(0, -1);
  if (w.length > 3 && w.endsWith('e')) w = w.slice(0, -1);
  return w;
}

/** normalize() + stem() over a whole sentence. */
export function prepare(text) {
  return normalize(text).split(' ').filter(Boolean).map(stem).join(' ');
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Turns a keyword such as  "pay * off * faster|sooner"  into a regex over stemmed text.
 *   word        a literal word (stemmed the same way the text is)
 *   a|b         either word
 *   *           up to MAX_GAP arbitrary words (including none)
 */
export function compileTerm(term) {
  const tokens = term.trim().split(/\s+/);
  let source = '';
  tokens.forEach((token, i) => {
    if (token === '*') {
      if (i === 0 || i === tokens.length - 1) throw new Error(`"*" cannot start or end a keyword: "${term}"`);
      source += `(?: [a-z0-9$%]+){0,${MAX_GAP}}`;
      return;
    }
    const alternatives = token.split('|').map((alt) => escapeRe(stem(normalize(alt))));
    if (alternatives.some((a) => !a)) throw new Error(`empty word in keyword: "${term}"`);
    const group = alternatives.length > 1 ? `(?:${alternatives.join('|')})` : alternatives[0];
    source += (i === 0 ? '' : ' ') + group;
  });
  return new RegExp(`\\b${source}\\b`);
}

/**
 * Compiles an intent registry once. `intents` maps a topic name to
 *   { priority, terms: [[keyword, weight], …], negative?: [[keyword, weight], …],
 *     patterns?: [[RegExp over stemmed text, weight], …] }
 */
export function createRouter(intents) {
  const compiled = Object.entries(intents).map(([category, intent]) => ({
    category,
    priority: intent.priority ?? 0,
    positive: [
      ...intent.terms.map(([term, weight]) => ({ label: term, re: compileTerm(term), weight })),
      ...(intent.patterns ?? []).map(([re, weight]) => ({ label: String(re), re, weight })),
    ],
    negative: (intent.negative ?? []).map(([term, weight]) => ({
      label: term,
      re: compileTerm(term),
      weight: -Math.abs(weight),
    })),
  }));

  /**
   * @param text      the borrower's words
   * @param allowed   optional list of topic names the caller is willing to accept; every
   *                  other topic is ignored (the core decides which topics are selectable)
   * @returns { category: string|null, scores, matched, normalized }
   */
  function classify(text, allowed) {
    const normalized = prepare(text);
    const allow = allowed && allowed.length > 0 ? new Set(allowed) : null;
    const scores = {};
    const matched = {};

    for (const topic of compiled) {
      if (allow && !allow.has(topic.category)) continue;
      const hits = [...topic.positive, ...topic.negative].filter((t) => t.re.test(normalized));
      if (hits.length === 0) continue;
      scores[topic.category] = hits.reduce((sum, t) => sum + t.weight, 0);
      matched[topic.category] = hits.map((t) => ({ term: t.label, weight: t.weight }));
    }

    let winner = null;
    for (const topic of compiled) {
      const score = scores[topic.category];
      if (score === undefined || score < MIN_SCORE) continue;
      if (
        winner === null ||
        score > scores[winner.category] ||
        (score === scores[winner.category] && topic.priority > winner.priority)
      ) {
        winner = topic;
      }
    }
    return { category: winner ? winner.category : null, scores, matched, normalized };
  }

  return { classify, topics: compiled.map((t) => t.category) };
}
