// Builds db/data/loanservicing.db (SQLite) from schema.sql, the inline seed below, and
// seed-data.mjs (the job catalog and chat history).
// Usage: node db/build.mjs   (requires Node 22+ for node:sqlite)
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { JOB_POSTINGS, CHAT_HISTORY } from './seed-data.mjs';

// One entry per borrower: [borrower, loan, payment, user_authentication] fields.
const SEED = [
  { username: 'alice', password: 'demo123', firstName: 'Alice', lastName: 'Thompson', userType: 1, programOfStudy: 'Computer Science', city: 'Toronto', province: 'ON', creditScore: 788,
    originalAmount: 42000, currentBalance: 18450, interestRate: 4.25, monthlyPayment: 412.55, maturityDate: '2031-05-01',
    nextPaymentDate: '2026-08-01', nextPaymentAmount: 412.55, paymentsMade: 58, paymentsMissed: 0, onTimeStreak: 58 },
  { username: 'grace', password: 'demo123', firstName: 'Grace', lastName: 'Kim', userType: 1, programOfStudy: 'Registered Nursing', city: 'Vancouver', province: 'BC', creditScore: 802,
    originalAmount: 55000, currentBalance: 21200, interestRate: 3.9, monthlyPayment: 498.1, maturityDate: '2032-02-05',
    nextPaymentDate: '2026-08-05', nextPaymentAmount: 498.1, paymentsMade: 61, paymentsMissed: 0, onTimeStreak: 61 },
  { username: 'bob', password: 'demo123', firstName: 'Bob', lastName: 'Martinez', userType: 2, programOfStudy: 'Mechanical Engineering', city: 'Calgary', province: 'AB', creditScore: 671,
    originalAmount: 38000, currentBalance: 26800, interestRate: 5.1, monthlyPayment: 377.2, maturityDate: '2033-09-01',
    nextPaymentDate: '2026-08-01', nextPaymentAmount: 377.2, paymentsMade: 34, paymentsMissed: 3, onTimeStreak: 4 },
  { username: 'henry', password: 'demo123', firstName: 'Henry', lastName: 'Osei', userType: 2, programOfStudy: 'Marketing', city: 'Winnipeg', province: 'MB', creditScore: 684,
    originalAmount: 29000, currentBalance: 20150, interestRate: 5.35, monthlyPayment: 301.75, maturityDate: '2033-11-03',
    nextPaymentDate: '2026-08-03', nextPaymentAmount: 301.75, paymentsMade: 29, paymentsMissed: 2, onTimeStreak: 6 },
  { username: 'carol', password: 'demo123', firstName: 'Carol', lastName: 'Nguyen', userType: 3, programOfStudy: 'Graphic Design', city: 'Montreal', province: 'QC', creditScore: 588,
    originalAmount: 31000, currentBalance: 29400, interestRate: 6.2, monthlyPayment: 318.9, maturityDate: '2034-04-01',
    nextPaymentDate: '2026-06-01', nextPaymentAmount: 637.8, paymentsMade: 11, paymentsMissed: 7, onTimeStreak: 0 },
  { username: 'irene', password: 'demo123', firstName: 'Irene', lastName: 'Delgado', userType: 3, programOfStudy: 'Culinary Arts', city: 'Halifax', province: 'NS', creditScore: 561,
    originalAmount: 26000, currentBalance: 24950, interestRate: 6.45, monthlyPayment: 272.4, maturityDate: '2034-08-15',
    nextPaymentDate: '2026-05-15', nextPaymentAmount: 817.2, paymentsMade: 8, paymentsMissed: 9, onTimeStreak: 0 },
];

// ---- History seed -----------------------------------------------------------
// Recent payment history per borrower, shaped by their delinquency level:
//   type 1 (alice, grace)  every installment on time, plus an occasional extra to principal
//   type 2 (bob, henry)    on time except for a gap of missed months, then back on track
//   type 3 (carol, irene)  a few small or partial payments, then they stop paying
// Dates line up with each borrower's nextPaymentDate / onTimeStreak above. balance_after
// is computed BACKWARDS from the loan's current balance, so the last row always equals
// loan.current_balance and each earlier row is what the loan plausibly was then.
const CHK = 'Checking ••••1234', SAV = 'Savings ••••5678', DBT = 'Debit card ••••9012';
const inst = (date, amount, source = CHK) => ({ date, amount, applyTo: 'NEXT_INSTALLMENT', source });
const extra = (date, amount, source = CHK) => ({ date, amount, applyTo: 'PRINCIPAL', source });

const PAYMENT_PLAN = {
  alice: [
    inst('2025-11-01', 412.55), inst('2025-12-01', 412.55), inst('2026-01-01', 412.55),
    inst('2026-02-01', 412.55), extra('2026-02-10', 500, SAV), inst('2026-03-01', 412.55),
    inst('2026-04-01', 412.55), inst('2026-05-01', 412.55), inst('2026-06-01', 412.55),
    inst('2026-07-01', 412.55),
  ],
  grace: [
    inst('2025-12-05', 498.1), inst('2026-01-05', 498.1), inst('2026-02-05', 498.1, SAV),
    inst('2026-03-05', 498.1), inst('2026-04-05', 498.1), inst('2026-05-05', 498.1, SAV),
    inst('2026-06-05', 498.1), inst('2026-07-05', 498.1),
  ],
  bob: [
    inst('2025-10-01', 377.2), inst('2025-11-03', 377.2), inst('2025-12-01', 377.2, DBT),
    inst('2026-04-01', 377.2), inst('2026-05-01', 377.2), inst('2026-06-01', 377.2, DBT),
    inst('2026-07-01', 377.2),
  ],
  henry: [
    inst('2025-10-03', 301.75), inst('2025-11-03', 301.75), inst('2026-02-03', 301.75, DBT),
    inst('2026-03-03', 301.75), inst('2026-04-03', 301.75), inst('2026-05-03', 301.75, DBT),
    inst('2026-06-03', 301.75), inst('2026-07-03', 301.75),
  ],
  carol: [
    inst('2025-12-01', 318.9, DBT), inst('2026-01-02', 318.9, DBT), inst('2026-02-01', 150, DBT),
    inst('2026-03-01', 318.9, DBT), inst('2026-04-01', 120, DBT),
  ],
  irene: [
    inst('2025-10-15', 272.4, DBT), inst('2025-11-15', 150, DBT), inst('2025-12-15', 272.4, DBT),
    inst('2026-01-15', 100, DBT), inst('2026-02-15', 75, DBT),
  ],
};

// Contact changes over time. Each update changes some fields; the history row stores
// the FULL contact as it stood afterwards, and the last one is what borrower_contact holds.
const PROFILE_PLAN = {
  alice: [
    { date: '2025-11-12', phone: '(416) 555-0134' },
    { date: '2026-03-20', email: 'alice.t@outlook.com' },
  ],
  grace: [
    { date: '2025-10-08', phone: '(604) 555-0178' },
    { date: '2026-01-15', mailingAddress: '900 West Georgia Street, Vancouver, British Columbia, BC  V6C 2W6' },
    { date: '2026-05-02', email: 'grace.kim@proton.me' },
  ],
  bob: [
    { date: '2025-12-20', phone: '(403) 555-0161' },
    { date: '2026-04-09', email: 'b.martinez@gmail.com' },
  ],
  henry: [
    { date: '2025-11-18', email: 'henry.osei@gmail.com' },
    { date: '2026-02-24', phone: '(204) 555-0119' },
    { date: '2026-06-11', mailingAddress: '212 Osborne Street, Winnipeg, Manitoba, MB  R3L 1Z1' },
  ],
  carol: [
    { date: '2026-02-10', phone: '(514) 555-0127' },
    { date: '2026-04-22', mailingAddress: '455 Rue Saint-Denis, Montreal, Quebec, QC  H2X 3P5' },
    { date: '2026-05-28', email: 'carol.nguyen.design@gmail.com' },
  ],
  irene: [
    { date: '2026-01-30', phone: '(902) 555-0193' },
    { date: '2026-04-17', mailingAddress: '14 Quinpool Road, Halifax, Nova Scotia, NS  B3K 2L3' },
  ],
};

// Deterministic references, so rebuilding the database gives the same history every time.
const REF_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function seededRandom(seed) {
  let a = [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const makeRef = (prefix, date, rand) =>
  `${prefix}-${date.replaceAll('-', '')}-${Array.from({ length: 6 }, () => REF_ALPHABET[Math.floor(rand() * REF_ALPHABET.length)]).join('')}`;
const round2 = (n) => Math.round(n * 100) / 100;
const monthsBetween = (a, b) => (Number(b.slice(0, 4)) - Number(a.slice(0, 4))) * 12 + Number(b.slice(5, 7)) - Number(a.slice(5, 7));

/** Payments with refs and balance_after, working back from the loan's current balance. */
function buildPayments(s) {
  const rand = seededRandom(s.username + ':pay');
  const rows = PAYMENT_PLAN[s.username].map((p) => ({ ...p, ref: makeRef('PMT', p.date, rand) }));
  const monthlyRate = s.interestRate / 100 / 12;
  let balance = s.currentBalance;
  for (let k = rows.length - 1; k >= 0; k--) {
    rows[k].balanceAfter = round2(balance);
    if (rows[k].applyTo === 'PRINCIPAL') {
      balance += rows[k].amount;
    } else {
      // Interest accrued over the months since the previous payment (a gap = missed months).
      const months = k > 0 ? Math.max(1, monthsBetween(rows[k - 1].date, rows[k].date)) : 1;
      balance = (balance + rows[k].amount) / (1 + monthlyRate) ** months;
    }
  }
  return rows;
}

/** Profile updates with refs and the cumulative contact after each one. */
function buildProfileUpdates(username) {
  const rand = seededRandom(username + ':prf');
  let contact = { ...CONTACTS[username] };
  return PROFILE_PLAN[username].map(({ date, ...change }) => {
    contact = { ...contact, ...change };
    return { date, ref: makeRef('PRF', date, rand), ...contact };
  });
}

// Starting contact details per borrower, as at account opening (before any update above).
const CONTACTS = {
  alice: { email: 'alice.thompson@example.com', phone: '', mailingAddress: '128 Maple Street, Toronto, Ontario, ON  M5V 2T6' },
  grace: { email: 'grace.kim@example.com', phone: '', mailingAddress: '455 Granville Street, Vancouver, British Columbia, BC  V6C 1T1' },
  bob: { email: 'bob.martinez@example.com', phone: '', mailingAddress: '72 Stephen Avenue SW, Calgary, Alberta, AB  T2P 1J9' },
  henry: { email: 'henry.osei@example.com', phone: '', mailingAddress: '310 Portage Avenue, Winnipeg, Manitoba, MB  R3C 0B1' },
  carol: { email: 'carol.nguyen@example.com', phone: '', mailingAddress: '1200 Rue Sainte-Catherine O, Montreal, Quebec, QC  H3B 1H6' },
  irene: { email: 'irene.delgado@example.com', phone: '', mailingAddress: '88 Spring Garden Road, Halifax, Nova Scotia, NS  B3J 1G1' },
};

const here = dirname(fileURLToPath(import.meta.url));
const dbFile = join(here, 'data', 'loanservicing.db');

// The file is reused, not deleted: schema.sql drops and recreates every table, and
// another process (an editor, an indexer) may hold the file open on Windows.
mkdirSync(dirname(dbFile), { recursive: true });

const db = new DatabaseSync(dbFile);
db.exec(readFileSync(join(here, 'schema.sql'), 'utf8'));

const insBorrower = db.prepare(
  'INSERT INTO borrower(first_name,last_name,user_type,program_of_study,city,province,credit_score) VALUES(?,?,?,?,?,?,?)');
const insLoan = db.prepare(
  'INSERT INTO loan(borrower_id,original_amount,current_balance,interest_rate,monthly_payment,maturity_date) VALUES(?,?,?,?,?,?)');
const insPayment = db.prepare(
  'INSERT INTO payment(loan_id,next_payment_date,next_payment_amount,payments_made,payments_missed,on_time_streak) VALUES(?,?,?,?,?,?)');
const insContact = db.prepare(
  'INSERT INTO borrower_contact(borrower_id,email,phone,mailing_address) VALUES(?,?,?,?)');
const insHistory = db.prepare(
  'INSERT INTO payment_history(loan_id,reference_number,amount,funding_source,apply_to,effective_date,balance_after,created_at) VALUES(?,?,?,?,?,?,?,?)');
const insProfileHistory = db.prepare(
  'INSERT INTO profile_update_history(borrower_id,reference_number,email,phone,mailing_address,created_at) VALUES(?,?,?,?,?,?)');
const insChat = db.prepare(
  'INSERT INTO chat_history(borrower_id,live_chat_sessions,chatbot_messages,last_contact,tone_score,summary) VALUES(?,?,?,?,?,?)');
const insJob = db.prepare(
  'INSERT INTO job_posting(program,title,company,city,province,salary_amount,salary_unit,type) VALUES(?,?,?,?,?,?,?,?)');
const insAuth = db.prepare(
  'INSERT INTO user_authentication(username,password,borrower_id) VALUES(?,?,?)');

db.exec('BEGIN');
for (const s of SEED) {
  const borrowerId = insBorrower.run(s.firstName, s.lastName, s.userType, s.programOfStudy, s.city, s.province, s.creditScore).lastInsertRowid;
  const loanId = insLoan.run(borrowerId, s.originalAmount, s.currentBalance, s.interestRate, s.monthlyPayment, s.maturityDate).lastInsertRowid;
  insPayment.run(loanId, s.nextPaymentDate, s.nextPaymentAmount, s.paymentsMade, s.paymentsMissed, s.onTimeStreak);
  for (const p of buildPayments(s)) {
    insHistory.run(loanId, p.ref, p.amount, p.source, p.applyTo, p.date, p.balanceAfter, `${p.date} 10:05:00`);
  }
  // borrower_contact holds the contact as it stands after the last recorded update.
  const updates = buildProfileUpdates(s.username);
  for (const u of updates) {
    insProfileHistory.run(borrowerId, u.ref, u.email, u.phone, u.mailingAddress, `${u.date} 14:30:00`);
  }
  const c = updates[updates.length - 1];
  insContact.run(borrowerId, c.email, c.phone, c.mailingAddress);
  const chat = CHAT_HISTORY[s.username];
  if (chat) insChat.run(borrowerId, chat.liveChatSessions, chat.chatbotMessages, chat.lastContact, chat.toneScore, chat.summary);
  insAuth.run(s.username, s.password, borrowerId);
}
for (const j of JOB_POSTINGS) {
  insJob.run(j.program, j.title, j.company, j.city, j.province, j.salaryAmount, j.salaryUnit, j.type);
}
db.exec('COMMIT');

for (const t of ['borrower', 'loan', 'payment', 'payment_history', 'borrower_contact', 'profile_update_history', 'chat_history', 'job_posting', 'user_authentication']) {
  console.log(t.padEnd(20), db.prepare(`SELECT COUNT(*) n FROM ${t}`).get().n);
}
db.exec('VACUUM');
db.close();
console.log('->', dbFile);
