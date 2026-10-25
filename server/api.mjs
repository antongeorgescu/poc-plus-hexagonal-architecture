// Local API in front of db/data/loanservicing.db — the only process that touches the file.
// The Angular dev server proxies /api to it (see proxy.conf.js).
//   POST /api/login     { username, password }       -> 200 { user } | 401
//   POST /api/payments  PaymentRecord                -> 201 { success, message, user } | 400 | 404 | 409
//   POST /api/profile   ProfileRecord                -> 201 { success, message, user } | 400 | 404 | 409
//   GET  /api/payments/history?username=             -> 200 { success, entries } | 400 | 404
//   GET  /api/profile/history?username=              -> 200 { success, entries } | 400 | 404
//   GET  /api/jobs?program=                          -> 200 { success, postings } | 400   (grounding data)
//   GET  /api/chat-history?username=                 -> 200 { success, record | null } | 400 | 404
//   POST /api/language-model/classify         { text, candidates? } -> { category | null, scores, matched }
//   POST /api/language-model/narrate-loan     { profile, loan }     -> { text }
//   POST /api/language-model/narrate-payments { payment }           -> { text }
//   POST /api/language-model/describe-tone    { label }             -> { text }
//   POST /api/language-model/compose-welcome  { user }              -> { copy }
//   (the "language model" is the keyword router + templates in ./language-model — no LLM)
// Usage: node server/api.mjs        (requires Node 22+ for node:sqlite; port via API_PORT)
import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRouter } from './language-model/keyword-router.mjs';
import { INTENTS } from './language-model/intents.mjs';
import * as narration from './language-model/narration.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const DB_FILE = process.env.DB_FILE || join(here, '..', 'db', 'data', 'loanservicing.db');
const PORT = Number(process.env.API_PORT || 3000);

const db = new DatabaseSync(DB_FILE);
db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 3000;');

const USER_SQL = `
  SELECT a.username, b.first_name, b.last_name, b.user_type, b.program_of_study,
         b.city, b.province, b.credit_score, l.loan_id, l.original_amount,
         l.current_balance, l.interest_rate, l.monthly_payment, l.maturity_date,
         p.next_payment_date, p.next_payment_amount, p.payments_made,
         p.payments_missed, p.on_time_streak, b.borrower_id,
         COALESCE(c.email, '') AS email, COALESCE(c.phone, '') AS phone,
         COALESCE(c.mailing_address, '') AS mailing_address
    FROM user_authentication a
    JOIN borrower b ON b.borrower_id = a.borrower_id
    JOIN loan l     ON l.borrower_id = b.borrower_id
    JOIN payment p  ON p.loan_id     = l.loan_id
    LEFT JOIN borrower_contact c ON c.borrower_id = b.borrower_id
   WHERE a.username = ? COLLATE NOCASE`;
const findRow = db.prepare(USER_SQL);
const findPassword = db.prepare('SELECT password FROM user_authentication WHERE username = ? COLLATE NOCASE');

/** DB row -> the `User` shape the Angular core uses. Never includes the password. */
const toUser = (r) => ({
  username: r.username, firstName: r.first_name, lastName: r.last_name,
  userType: r.user_type, programOfStudy: r.program_of_study, city: r.city, province: r.province,
  originalAmount: r.original_amount, currentBalance: r.current_balance,
  interestRate: r.interest_rate, monthlyPayment: r.monthly_payment,
  nextPaymentDate: r.next_payment_date, nextPaymentAmount: r.next_payment_amount,
  maturityDate: r.maturity_date, paymentsMade: r.payments_made,
  paymentsMissed: r.payments_missed, onTimeStreak: r.on_time_streak, creditScore: r.credit_score,
  email: r.email, phone: r.phone, mailingAddress: r.mailing_address,
});

const insHistory = db.prepare(`INSERT INTO payment_history
  (loan_id, reference_number, amount, funding_source, apply_to, effective_date, balance_after)
  VALUES (?, ?, ?, ?, ?, ?, ?)`);
const updLoan = db.prepare('UPDATE loan SET current_balance = ? WHERE loan_id = ?');
const updPayment = db.prepare(`UPDATE payment SET next_payment_date = ?, next_payment_amount = ?,
  payments_made = ?, on_time_streak = ? WHERE loan_id = ?`);

const upsertContact = db.prepare(`INSERT INTO borrower_contact (borrower_id, email, phone, mailing_address)
  VALUES (?, ?, ?, ?) ON CONFLICT(borrower_id) DO UPDATE SET
  email = excluded.email, phone = excluded.phone, mailing_address = excluded.mailing_address`);
const insProfileHistory = db.prepare(`INSERT INTO profile_update_history
  (borrower_id, reference_number, email, phone, mailing_address) VALUES (?, ?, ?, ?, ?)`);

const selPaymentHistory = db.prepare(`
  SELECT h.payment_history_id AS id, h.reference_number, h.amount, h.funding_source, h.apply_to,
         h.effective_date, h.balance_after, h.created_at
    FROM payment_history h
    JOIN loan l ON l.loan_id = h.loan_id
    JOIN user_authentication a ON a.borrower_id = l.borrower_id
   WHERE a.username = ? COLLATE NOCASE
   ORDER BY h.payment_history_id`);
const selProfileHistory = db.prepare(`
  SELECT h.profile_update_id AS id, h.reference_number, h.email, h.phone, h.mailing_address, h.created_at
    FROM profile_update_history h
    JOIN user_authentication a ON a.borrower_id = h.borrower_id
   WHERE a.username = ? COLLATE NOCASE
   ORDER BY h.profile_update_id`);

const money = (n) => Math.round(n * 100) / 100;
const isNum = (n) => typeof n === 'number' && Number.isFinite(n);
const isIso = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function login({ username, password }) {
  const pw = typeof username === 'string' ? findPassword.get(username.trim()) : undefined;
  const row = pw && pw.password === password ? findRow.get(username.trim()) : undefined;
  if (!row) throw new HttpError(401, 'Invalid username or password.');
  return { user: toUser(row) };
}

/**
 * Persists one already-decided payment. The browser-side core decides (validation,
 * balance math, schedule change); this only records it — but it still refuses
 * anything inconsistent with the stored loan, so a stale or tampered request
 * cannot corrupt the ledger.
 */
function recordPayment(b) {
  const u = b?.updated;
  if (typeof b?.username !== 'string' || typeof b.referenceNumber !== 'string' || !b.referenceNumber
      || typeof b.fundingSource !== 'string' || !b.fundingSource
      || !['PRINCIPAL', 'NEXT_INSTALLMENT'].includes(b.applyTo) || !isIso(b.effectiveDate)
      || !isNum(b.amount) || b.amount <= 0 || !isNum(b.expectedBalance) || !u
      || !isNum(u.currentBalance) || !isNum(u.nextPaymentAmount) || !isIso(u.nextPaymentDate)
      || !Number.isInteger(u.paymentsMade) || !Number.isInteger(u.onTimeStreak)) {
    throw new HttpError(400, 'Malformed payment request.');
  }

  db.exec('BEGIN IMMEDIATE');
  try {
    const row = findRow.get(b.username.trim());
    if (!row) throw new HttpError(404, 'Borrower not found.');
    if (Math.abs(row.current_balance - b.expectedBalance) > 0.005) {
      throw new HttpError(409, 'Your account changed since this page loaded. Refresh and try again.');
    }
    if (b.amount > row.current_balance + 0.005
        || Math.abs(money(row.current_balance - b.amount) - u.currentBalance) > 0.005) {
      throw new HttpError(400, 'Payment does not match the loan balance.');
    }
    insHistory.run(row.loan_id, b.referenceNumber, b.amount, b.fundingSource, b.applyTo,
      b.effectiveDate, u.currentBalance);
    updLoan.run(u.currentBalance, row.loan_id);
    updPayment.run(u.nextPaymentDate, u.nextPaymentAmount, u.paymentsMade, u.onTimeStreak, row.loan_id);
    db.exec('COMMIT');
    return { status: 201, body: { success: true, message: 'Payment recorded.', user: toUser(findRow.get(b.username.trim())) } };
  } catch (e) {
    db.exec('ROLLBACK');
    if (/UNIQUE constraint failed: payment_history.reference_number/.test(e.message)) {
      throw new HttpError(409, 'Duplicate payment reference. Please submit again.');
    }
    throw e;
  }
}

/**
 * Persists one already-validated contact update. As with payments, the browser-side
 * core decides; this re-checks the basics so a malformed or tampered request cannot
 * write junk, then updates borrower_contact and logs the reference in one transaction.
 */
function saveProfile(b) {
  const u = b?.updated;
  const isText = (s, max) => typeof s === 'string' && s.length <= max;
  const digits = typeof u?.phone === 'string' ? u.phone.replace(/\D/g, '') : '';
  if (typeof b?.username !== 'string' || typeof b.referenceNumber !== 'string' || !b.referenceNumber
      || !u || !isText(u.email, 254) || !isText(u.phone, 40) || !isText(u.mailingAddress, 300)
      || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.email) || !u.mailingAddress.trim()
      || (u.phone && (digits.length < 10 || digits.length > 15))) {
    throw new HttpError(400, 'Malformed profile update.');
  }

  db.exec('BEGIN IMMEDIATE');
  try {
    const row = findRow.get(b.username.trim());
    if (!row) throw new HttpError(404, 'Borrower not found.');
    upsertContact.run(row.borrower_id, u.email, u.phone, u.mailingAddress);
    insProfileHistory.run(row.borrower_id, b.referenceNumber, u.email, u.phone, u.mailingAddress);
    db.exec('COMMIT');
    return { status: 201, body: { success: true, message: 'Profile updated.', user: toUser(findRow.get(b.username.trim())) } };
  } catch (e) {
    db.exec('ROLLBACK');
    if (/UNIQUE constraint failed: profile_update_history.reference_number/.test(e.message)) {
      throw new HttpError(409, 'Duplicate profile reference. Please submit again.');
    }
    throw e;
  }
}

const selJobsForProgram = db.prepare(
  `SELECT title, company, city, province, salary_amount, salary_unit, type
     FROM job_posting WHERE program = ? COLLATE NOCASE ORDER BY job_posting_id`);
const GENERAL_PROGRAM = 'General';
const selChat = db.prepare(
  `SELECT c.live_chat_sessions, c.chatbot_messages, c.last_contact, c.tone_score, c.summary
     FROM chat_history c JOIN user_authentication a ON a.borrower_id = c.borrower_id
    WHERE a.username = ? COLLATE NOCASE`);

/** Postings for a program of study; when it has none, the postings open to any field. */
function jobsForProgram(query) {
  const program = query.get('program');
  if (!program || !program.trim()) throw new HttpError(400, 'program is required.');
  let rows = selJobsForProgram.all(program.trim());
  if (rows.length === 0) rows = selJobsForProgram.all(GENERAL_PROGRAM);
  return {
    status: 200,
    body: {
      success: true, message: '',
      postings: rows.map((r) => ({
        title: r.title, company: r.company, city: r.city, province: r.province,
        salaryAmount: r.salary_amount, salaryUnit: r.salary_unit, type: r.type,
      })),
    },
  };
}

/** Raw chat facts for a borrower; `record: null` when they have no row at all. */
function chatHistory(query) {
  const username = query.get('username');
  if (!username || !username.trim()) throw new HttpError(400, 'username is required.');
  if (!findRow.get(username.trim())) throw new HttpError(404, 'Borrower not found.');
  const r = selChat.get(username.trim());
  return {
    status: 200,
    body: {
      success: true, message: '',
      record: r ? {
        liveChatSessions: r.live_chat_sessions, chatbotMessages: r.chatbot_messages,
        lastContact: r.last_contact, toneScore: r.tone_score, summary: r.summary,
      } : null,
    },
  };
}

// SQLite stores created_at as UTC "YYYY-MM-DD HH:MM:SS"; the browser wants an ISO instant.
const asInstant = (s) => s.replace(' ', 'T') + 'Z';

/** Oldest-first; ordering for display is a business rule and lives in the Angular core. */
function readHistory(query, select, toEntry) {
  const username = query.get('username');
  if (!username || !username.trim()) throw new HttpError(400, 'username is required.');
  if (!findRow.get(username.trim())) throw new HttpError(404, 'Borrower not found.');
  return { status: 200, body: { success: true, message: '', entries: select.all(username.trim()).map(toEntry) } };
}

const keywordRouter = createRouter(INTENTS);
const isStr = (s, max = 200) => typeof s === 'string' && s.length <= max;

/** The "model" answers in words only; these handlers validate shape and delegate. */
const languageModel = {
  classify(b) {
    if (typeof b?.text !== 'string' || b.text.length > 2000) {
      throw new HttpError(400, 'text is required (at most 2000 characters).');
    }
    // The Angular core says which topics it will accept; anything else is ignored.
    const allowed = Array.isArray(b.candidates)
      ? b.candidates.map((c) => c?.category).filter((c) => typeof c === 'string')
      : undefined;
    const { category, scores, matched } = keywordRouter.classify(b.text, allowed);
    return { status: 200, body: { success: true, category, scores, matched } };
  },
  narrateLoan(b) {
    const l = b?.loan;
    const numeric = ['originalAmount', 'currentBalance', 'interestRate', 'paidPercent', 'monthsToMaturity'];
    if (!isStr(b?.profile?.programOfStudy) || !l || !numeric.every((k) => isNum(l[k])) || !isStr(l.maturityDate, 10)) {
      throw new HttpError(400, 'Malformed loan narration request.');
    }
    return { status: 200, body: { success: true, text: narration.narrateLoan(b.profile, l) } };
  },
  narratePayments(b) {
    const p = b?.payment;
    const numeric = ['monthlyPayment', 'nextPaymentAmount', 'paymentsMade', 'paymentsMissed', 'onTimeStreak', 'pastDueAmount'];
    if (!p || !numeric.every((k) => isNum(p[k])) || !isStr(p.nextPaymentDate, 10) || typeof p.isPastDue !== 'boolean') {
      throw new HttpError(400, 'Malformed payment narration request.');
    }
    return { status: 200, body: { success: true, text: narration.narratePayments(p) } };
  },
  describeTone(b) {
    const text = isStr(b?.label, 40) ? narration.describeTone(b.label) : null;
    if (text === null) throw new HttpError(400, 'Unknown sentiment label.');
    return { status: 200, body: { success: true, text } };
  },
  composeWelcome(b) {
    const copy = isStr(b?.user?.firstName, 100) ? narration.composeWelcome(b.user) : null;
    if (copy === null) throw new HttpError(400, 'firstName and a userType of 1, 2 or 3 are required.');
    return { status: 200, body: { success: true, copy } };
  },
};

const routes = {
  'POST /api/language-model/classify': (b) => languageModel.classify(b),
  'POST /api/language-model/narrate-loan': (b) => languageModel.narrateLoan(b),
  'POST /api/language-model/narrate-payments': (b) => languageModel.narratePayments(b),
  'POST /api/language-model/describe-tone': (b) => languageModel.describeTone(b),
  'POST /api/language-model/compose-welcome': (b) => languageModel.composeWelcome(b),
  'GET /api/jobs': (_body, query) => jobsForProgram(query),
  'GET /api/chat-history': (_body, query) => chatHistory(query),
  'GET /api/payments/history': (_body, query) => readHistory(query, selPaymentHistory, (r) => ({
    id: r.id, referenceNumber: r.reference_number, amount: r.amount, fundingSource: r.funding_source,
    applyTo: r.apply_to, effectiveDate: r.effective_date, balanceAfter: r.balance_after,
    recordedAt: asInstant(r.created_at),
  })),
  'GET /api/profile/history': (_body, query) => readHistory(query, selProfileHistory, (r) => ({
    id: r.id, referenceNumber: r.reference_number, email: r.email, phone: r.phone,
    mailingAddress: r.mailing_address, recordedAt: asInstant(r.created_at),
  })),
  'POST /api/login': (body) => ({ status: 200, body: login(body) }),
  'POST /api/payments': recordPayment,
  'POST /api/profile': saveProfile,
};

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 16_384) { reject(new HttpError(413, 'Body too large.')); req.destroy(); } });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new HttpError(400, 'Invalid JSON.')); } });
    req.on('error', reject);
  });
}

http.createServer(async (req, res) => {
  const send = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
  try {
    const url = new URL(req.url, 'http://localhost');
    const handler = routes[`${req.method} ${url.pathname}`];
    if (!handler) throw new HttpError(404, 'Not found.');
    const out = await handler(await readJson(req), url.searchParams);
    send(out.status ?? 200, out.body ?? out);
  } catch (e) {
    if (e instanceof HttpError) return send(e.status, { success: false, message: e.message });
    console.error('[api]', e);
    send(500, { success: false, message: 'Unexpected server error.' });
  }
}).listen(PORT, '127.0.0.1', () => console.log(`[api] http://127.0.0.1:${PORT}  db=${DB_FILE}`));
