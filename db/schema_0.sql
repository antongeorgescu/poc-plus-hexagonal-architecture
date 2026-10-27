-- SQLite schema. Build the database file with: node db/build.mjs
PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS chat_history;
DROP TABLE IF EXISTS job_posting;
DROP TABLE IF EXISTS profile_update_history;
DROP TABLE IF EXISTS borrower_contact;
DROP TABLE IF EXISTS payment_history;
DROP TABLE IF EXISTS payment;
DROP TABLE IF EXISTS user_authentication;
DROP TABLE IF EXISTS loan;
DROP TABLE IF EXISTS borrower;

CREATE TABLE borrower (
  borrower_id      INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name       TEXT NOT NULL,
  last_name        TEXT NOT NULL,
  user_type        INTEGER NOT NULL CHECK (user_type IN (1,2,3)),
  program_of_study TEXT NOT NULL,
  city             TEXT NOT NULL,
  province         TEXT NOT NULL CHECK (length(province) = 2),
  credit_score     INTEGER NOT NULL
);

CREATE TABLE loan (
  loan_id         INTEGER PRIMARY KEY AUTOINCREMENT,
  borrower_id     INTEGER NOT NULL REFERENCES borrower(borrower_id),
  original_amount REAL NOT NULL,
  current_balance REAL NOT NULL,
  interest_rate   REAL NOT NULL,
  monthly_payment REAL NOT NULL,
  maturity_date   TEXT NOT NULL            -- ISO yyyy-mm-dd
);

CREATE TABLE payment (
  payment_id          INTEGER PRIMARY KEY AUTOINCREMENT,
  loan_id             INTEGER NOT NULL REFERENCES loan(loan_id),
  next_payment_date   TEXT NOT NULL,       -- ISO yyyy-mm-dd
  next_payment_amount REAL NOT NULL,
  payments_made       INTEGER NOT NULL,
  payments_missed     INTEGER NOT NULL,
  on_time_streak      INTEGER NOT NULL
);

-- One row per payment the borrower actually submitted (written by server/api.mjs).
-- The payment table above is the loan's CURRENT schedule posture; this is the ledger.
CREATE TABLE payment_history (
  payment_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
  loan_id            INTEGER NOT NULL REFERENCES loan(loan_id),
  reference_number   TEXT NOT NULL UNIQUE,
  amount             REAL NOT NULL CHECK (amount > 0),
  funding_source     TEXT NOT NULL,
  apply_to           TEXT NOT NULL CHECK (apply_to IN ('PRINCIPAL','NEXT_INSTALLMENT')),
  effective_date     TEXT NOT NULL,            -- ISO yyyy-mm-dd
  balance_after      REAL NOT NULL,
  created_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Editable contact details, one row per borrower (updated by server/api.mjs).
CREATE TABLE borrower_contact (
  borrower_id     INTEGER PRIMARY KEY REFERENCES borrower(borrower_id),
  email           TEXT NOT NULL,
  phone           TEXT NOT NULL DEFAULT '',
  mailing_address TEXT NOT NULL
);

-- One row per accepted profile update: the reference the borrower was shown, and
-- the values they ended up with.
CREATE TABLE profile_update_history (
  profile_update_id INTEGER PRIMARY KEY AUTOINCREMENT,
  borrower_id       INTEGER NOT NULL REFERENCES borrower(borrower_id),
  reference_number  TEXT NOT NULL UNIQUE,
  email             TEXT NOT NULL,
  phone             TEXT NOT NULL,
  mailing_address   TEXT NOT NULL,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Job catalog. Grounding data only: each row carries its OWN
-- location and pay. Pay is an amount plus a unit so the app can format it.
CREATE TABLE job_posting (
  job_posting_id INTEGER PRIMARY KEY AUTOINCREMENT,
  program        TEXT NOT NULL,            -- program of study, or 'General' for any field
  title          TEXT NOT NULL,
  company        TEXT NOT NULL,
  city           TEXT NOT NULL,
  province       TEXT NOT NULL,
  salary_amount  REAL NOT NULL,
  salary_unit    TEXT NOT NULL CHECK (salary_unit IN ('yr','hr')),
  type           TEXT NOT NULL             -- Full-time / Contract / Part-time
);

-- Raw conversation facts, one row per borrower. The app's
-- cognitive layer interprets tone_score; nothing here is a decision.
CREATE TABLE chat_history (
  borrower_id        INTEGER PRIMARY KEY REFERENCES borrower(borrower_id),
  live_chat_sessions INTEGER NOT NULL,
  chatbot_messages   INTEGER NOT NULL,
  last_contact       TEXT NOT NULL,
  tone_score         INTEGER NOT NULL CHECK (tone_score BETWEEN 0 AND 100),
  summary            TEXT                  -- NULL = not enough history to recap
);

CREATE TABLE user_authentication (
  username    TEXT PRIMARY KEY,
  password    TEXT NOT NULL,               -- demo data only; plaintext, as the app compares it directly
  borrower_id INTEGER NOT NULL UNIQUE REFERENCES borrower(borrower_id)
);
