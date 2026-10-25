# Architecture decision records (security-relevant)

**System:** Hexagonal Student-Loan POC · **Date:** 2026-10-25

An architecture decision record (ADR) says *what was decided, why, and what it costs*. These cover the decisions that shape the security of this system, including the ones that created the risks in the [register](itsg-33-risk-register.md). Writing them down makes two things visible: which weaknesses were **deliberate trade-offs for a proof of concept**, and which decisions now need to change.

**Status values.** *Accepted* = in force. *Accepted for the POC only* = fine for a demo, to be reversed before real use. *Proposed* = a recommended change awaiting approval. *Superseded* = replaced.

| ADR | Decision | Status |
|---|---|---|
| [ADR-001](#adr-001--hexagonal-architecture-with-a-pure-core) | Hexagonal architecture with a pure core | Accepted |
| [ADR-002](#adr-002--business-rules-run-in-the-browser) | Business rules run in the browser | **Accepted for the POC only** → ADR-010 |
| [ADR-003](#adr-003--a-local-api-owns-the-database) | A local API owns the database | Accepted |
| [ADR-004](#adr-004--sqlite-through-the-experimental-nodesqlite-module) | SQLite through the experimental `node:sqlite` | **Accepted for the POC only** |
| [ADR-005](#adr-005--demo-grade-authentication) | Demo-grade authentication | **Accepted for the POC only** → ADR-009, ADR-011 |
| [ADR-006](#adr-006--the-default-language-model-is-a-server-side-keyword-router) | The default language model is a server-side keyword router | Accepted |
| [ADR-007](#adr-007--the-model-proposes-the-core-disposes) | The model proposes, the core disposes | Accepted |
| [ADR-008](#adr-008--history-tables-are-append-only-ledgers-with-a-running-balance) | History tables are ledgers with a running balance | Accepted |
| [ADR-009](#adr-009--server-side-sessions-with-csrf-defence) | Server-side sessions with CSRF defence | **Proposed** |
| [ADR-010](#adr-010--move-business-decisions-to-the-server) | Move business decisions to the server | **Proposed** |
| [ADR-011](#adr-011--hash-passwords-with-a-slow-salted-hash) | Hash passwords with a slow, salted hash | **Proposed** |
| [ADR-012](#adr-012--azure-openai-stays-off-until-conditions-are-met) | Azure OpenAI stays off until conditions are met | Accepted |

---

## ADR-001 · Hexagonal architecture with a pure core

**Context.** The system must keep business rules independent of the UI, the database and the language model so any of them can change.
**Decision.** Ports and adapters. The core (domain and application services) is plain TypeScript with no framework imports; every outside dependency sits behind a port with an adapter ([README.md](../README.md)).
**Consequences.**
- *Security upside:* every crossing of the trust boundary is one named port, which makes the data-flow diagram easy to draw and each adapter easy to harden or replace. Swapping the data source (CSV to SQLite to an API) changed no core code.
- *Security cost:* the structure **does not itself enforce who is calling**. Authentication has to be added in the adapters and the server (the [design](authn-authz-design.md) needs no core change).
**Related:** T1, SR-22.

## ADR-002 · Business rules run in the browser

**Context.** The first version was a browser-only demo. The rules that decide a payment's outcome (`processPayment`, `applyPayment`, `applyProfileUpdate`) live in the Angular core, so the app ran with no backend.
**Decision.** Keep the decision logic in the core, and have the API *store* the outcome after checking that the balance arithmetic is consistent.
**Consequences.**
- *Upside:* one implementation of each rule; the core stays testable and framework-free.
- *Downside, and the largest design risk:* **the browser is untrusted**, so a modified client chooses the outcome. TC-10 showed a forged schedule (due date 2099, amount due 0, streak 999) accepted. See T3, T4, AP3.
**Status.** Acceptable for a demo; **must be reversed before real use** → ADR-010.

## ADR-003 · A local API owns the database

**Context.** An earlier version opened the SQLite file in the browser with a WebAssembly build, which meant the browser downloaded the whole database, passwords included.
**Decision.** A small Node API is the only process that opens the file. The browser calls it through the dev-server proxy and never sees the database ([server/api.mjs](../server/api.mjs)).
**Consequences.**
- *Upside:* secrets and passwords no longer reach the browser; writes are transactional and checked; one place to add authentication.
- *Downside:* the API **exists but does not yet identify its callers** (T1). The proxy is a development tool; a production build needs the API behind the same path.

## ADR-004 · SQLite through the experimental `node:sqlite` module

**Context.** The POC needs a database with no setup, usable from a single process.
**Decision.** SQLite through Node's built-in `node:sqlite`, which needs no extra package.
**Consequences.**
- *Upside:* no dependency; trivially portable; the whole database is one file; easy to back up.
- *Downside:* the module is **experimental** and its API may change; there is a **single writer**, which a flood can starve (T11); the file is unencrypted (R16); the running Node (v26) is not an LTS release.
**Status.** Fine for one node with an encrypted volume and tested backups; move to a managed database when more than one API instance must write.

## ADR-005 · Demo-grade authentication

**Context.** The POC needed a way to log in six demo users without building an identity system.
**Decision.** Compare the username and password in the API against the database. Store the password as sent. Return the borrower record; keep it in browser memory. Identify later requests by a `username` field. ([schema.sql:106](../db/schema.sql#L106), [api.mjs:97](../server/api.mjs#L97))
**Consequences.** Simple, and unsafe: plain-text passwords (T6), no sessions or throttling (T1, T2), the identity taken from the request (T7). The database column carries the comment that it is "demo data only".
**Status.** **For the POC only.** Replaced by ADR-009 and ADR-011.

## ADR-006 · The default language model is a server-side keyword router

**Context.** The question router needed to pick the right card without depending on an external AI service, and without sending borrower text anywhere.
**Decision.** A weighted keyword router with a data registry and a regression table runs in the API ([server/language-model/](../server/language-model/)). It uses no LLM. Azure OpenAI remains an optional adapter that falls back to it.
**Consequences.**
- *Upside:* **nothing leaves the system by default**; deterministic, explainable (every answer lists the keywords behind it), testable, cheap, and bounded in time (T12).
- *Downside:* it matches words, not meaning, so a paraphrase with none of the keywords falls to "General". The endpoints that expose it are unauthenticated today (R21).

## ADR-007 · The model proposes, the core disposes

**Context.** Any model, keyword-based or an LLM, can be wrong or manipulated.
**Decision.** The model may only return a topic label, validated against the list the core offers, or prose shown as plain text. The core stamps the determinism flag and the label, and every authoritative figure comes from the deterministic region. The model never computes.
**Consequences.** Prompt injection, mislabelling or an outage can at worst show the wrong card; it cannot change money or policy ([llm-threat-checklist.md](llm-threat-checklist.md): LLM01, LLM05, LLM06). **Keep this under test** (SR-22, TC-30).

## ADR-008 · History tables are append-only ledgers with a running balance

**Context.** Payments and contact updates need a trail, and the new views list them newest first.
**Decision.** `payment_history` and `profile_update_history` are written once per event, with a unique reference and a timestamp. Each payment row stores the balance after it.
**Consequences.**
- *Upside:* the ledger can be **reconciled** (the last balance after must equal the loan balance; TC-26) and sorted deterministically.
- *Downside:* rows carry no actor (T5), the contact ledger stores full personal values (PT-05), and nothing prevents a privileged writer from altering rows. Add the actor and request id, and tamper-evident storage ([logging-incident-recovery.md](logging-incident-recovery.md)).

---

## Proposed decisions

### ADR-009 · Server-side sessions with CSRF defence

**Context.** The API must know who is calling (T1, T7, R21).
**Proposed decision.** Server-side sessions in a database table, an unguessable id in a `__Host-` cookie (`HttpOnly`, `Secure`, `SameSite=Strict`), a CSRF token on every write, strict `Origin` and JSON-only checks, and no wildcard CORS.
**Alternatives considered.** *Self-contained signed tokens (JWT):* no server lookup, but hard to revoke and easy to misuse; *basic or API-key auth:* unsuitable for people.
**Consequences.** One extra table and one lookup per request; instant revocation; the core is unchanged. Full design: [authn-authz-design.md](authn-authz-design.md). **Builds:** REM-01, REM-03, REM-04.

### ADR-010 · Move business decisions to the server

**Context.** ADR-002's trade-off no longer holds once real money is involved (T3, T4).
**Proposed decision.** The server runs the decision functions. The client sends intent and receives the result; schedule fields and references are computed or generated server-side; an idempotency key prevents replay.
**Alternatives considered.** *Keep client decisions and add more server validation:* the server would have to re-implement the rules, and the two copies would drift; *share the same TypeScript rules between client and server:* a good option, since the core is framework-free and could run in Node as is.
**Consequences.** Because the core has no framework imports, it can be **reused unchanged on the server**: the API calls `processPayment` and `applyPayment` itself. The client keeps the same functions for instant feedback, but their result is no longer trusted. **Builds:** REM-05.

### ADR-011 · Hash passwords with a slow, salted hash

**Proposed decision.** `scrypt` from `node:crypto` (no new dependency) with a per-password salt and stored parameters, or argon2id if a dependency is acceptable; constant-time comparison; a dummy hash for unknown users.
**Consequences.** Hashes can be upgraded at next login; a database leak no longer exposes passwords. **Builds:** REM-02.

### ADR-012 · Azure OpenAI stays off until conditions are met

**Context.** More data than expected would leave the system (T10), through an unauthenticated route (R20).
**Decision.** Keep Azure disabled. Enable it for real borrowers only when the conditions in [dependency-and-vendor-review.md](dependency-and-vendor-review.md), section 4.3, are met.
**Consequences.** No borrower data reaches a third party today; the keyword model covers every feature. **Builds:** REM-10, REM-17.

---

## How to use this file

- Add an ADR when a decision changes a trust boundary, a data flow, a secret, or who is trusted.
- Never edit an accepted ADR to hide a change of mind: add a new one that supersedes it and update the status.
- Link each new ADR to the risks it creates or closes, and to the REM item that builds it.
