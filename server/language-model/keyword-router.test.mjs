// Run with:  npm run test:router     (Node's built-in test runner — no dependencies)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRouter, compileTerm, normalize, prepare, stem, MIN_SCORE } from './keyword-router.mjs';
import { INTENTS } from './intents.mjs';
import { CASES } from './classification.cases.mjs';

const router = createRouter(INTENTS);

test('every question in the regression table lands on its topic', () => {
  const failures = [];
  for (const [question, expected] of CASES) {
    const { category, scores } = router.classify(question);
    if (category !== expected) failures.push(`  "${question}" -> ${category} (wanted ${expected}) scores=${JSON.stringify(scores)}`);
  }
  assert.equal(failures.length, 0, `\n${failures.join('\n')}`);
});

test('the regression table covers every topic at least three times', () => {
  for (const topic of router.topics) {
    const n = CASES.filter(([, expected]) => expected === topic).length;
    assert.ok(n >= 3, `${topic} has only ${n} regression cases`);
  }
});

test('the winning topic is always explainable: its matched keywords add up to its score', () => {
  for (const [question, expected] of CASES.filter(([, e]) => e)) {
    const { category, scores, matched } = router.classify(question);
    assert.equal(category, expected);
    const sum = matched[category].reduce((total, m) => total + m.weight, 0);
    assert.equal(sum, scores[category], `"${question}"`);
    assert.ok(scores[category] >= MIN_SCORE);
  }
});

test('restricting the allowed topics ignores the others', () => {
  const q = 'Show me my payment history';
  assert.equal(router.classify(q).category, 'PAYMENT_HISTORY');
  assert.equal(router.classify(q, ['NEXT_PAYMENT', 'LOAN_BALANCE']).category, null);
  assert.equal(router.classify(q, []).category, 'PAYMENT_HISTORY', 'an empty list means "no restriction"');
});

test('one keyword covers plurals, tenses and punctuation', () => {
  const re = compileTerm('update * address');
  for (const t of ['Update my address', 'UPDATING the address!', 'updated my mailing address', 'updates to addresses']) {
    assert.ok(re.test(prepare(t)), t);
  }
  assert.ok(!re.test(prepare('address update')), 'order matters');
});

test('the wildcard stands for at most three words', () => {
  const re = compileTerm('pay * off');
  assert.ok(re.test(prepare('pay it all off')));
  assert.ok(!re.test(prepare('pay one two three four off')));
});

test('apostrophes are dropped on both sides', () => {
  assert.equal(normalize("I can't afford it — it's the I've"), 'i cant afford it its the ive');
  assert.ok(compileTerm('cant afford').test(prepare("I can't afford this")));
});

test('the stemmer is consistent, not clever', () => {
  assert.equal(stem('payments'), stem('payment'));
  assert.equal(stem('changed'), stem('change'));
  assert.equal(stem('changes'), stem('changing'));
  assert.notEqual(stem('made'), stem('make')); // irregular forms are NOT unified: give them their own keyword
});

test('a malformed keyword fails loudly when the registry is compiled', () => {
  assert.throws(() => compileTerm('* leading'), /cannot start or end/);
  assert.throws(() => compileTerm('trailing *'), /cannot start or end/);
});

test('ties go to the topic with the higher priority', () => {
  const tied = createRouter({
    LOW: { priority: 1, terms: [['alpha', 5]] },
    HIGH: { priority: 9, terms: [['alpha', 5]] },
  });
  assert.equal(tied.classify('alpha').category, 'HIGH');
});

test('negative keywords subtract', () => {
  const r = createRouter({ T: { terms: [['pay', 5]], negative: [['history', 4]] } });
  assert.equal(r.classify('pay').category, 'T');
  assert.equal(r.classify('pay history').category, null); // 5 - 4 = 1 < MIN_SCORE
});
