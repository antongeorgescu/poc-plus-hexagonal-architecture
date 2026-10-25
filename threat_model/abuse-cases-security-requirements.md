# Abuse cases as security requirements

**System:** Hexagonal Student-Loan POC · **Status:** proposed requirements · **Date:** 2026-10-25

A threat model is only useful if it becomes something a team can build and test. This document turns each attack path and threat into a **security requirement (SR-nn)** with **acceptance criteria** written as *Given / When / Then* scenarios, so each can become an automated test.

Each entry is a **misuse case (MC-nn)**: what an attacker tries, written from their side. The requirement says what the system must do about it. Every requirement links to the risks it answers, the test that proves it ([security-test-plan.md](security-test-plan.md), TC-nn) and the work item that builds it ([remediation-plan.md](remediation-plan.md), REM-nn).

**Wording.** "Shall" marks a requirement. Priority follows the remediation phases: **P0** before any exposure or real data, **P1** before production, **P2** ongoing.

---

## 1. Requirements that close open risks

### MC-01 · An attacker reads another borrower's data

> *As an anonymous caller, I request another borrower's ledger, contact history or chat recap by name.*

**SR-01 (P0).** The system **shall** reveal a borrower's data only to that borrower, identified by an authenticated server-side session. The borrower **shall** be taken from the session and **shall never** be taken from a request body, query string or URL.

```gherkin
Scenario: no session
  Given I have no session
  When I request GET /api/payments/history
  Then the response is 401 and contains no ledger data

Scenario: a different borrower's data
  Given I am logged in as alice
  When I request the history of bob by any means
  Then the response is the same 404 I would get for a record that does not exist
```

*Answers:* T1, T7, PT-01, PT-08, AP1 · *Tests:* TC-01, TC-25 · *Builds:* REM-01, REM-03

### MC-02 · An attacker changes someone else's contact details

> *As an anonymous caller, I post new contact details for another borrower, then use them to impersonate that person.*

**SR-02 (P0).** The system **shall** apply a contact change only to the authenticated borrower's own record, **shall** require re-authentication for the change, and **shall** notify the previous contact address.

```gherkin
Scenario: no session
  When I POST /api/profile naming another borrower
  Then the response is 401 and no row is changed in borrower_contact or profile_update_history

Scenario: step-up and notification
  Given I am logged in as alice
  When I change my email without re-entering my password
  Then the change is refused with "step-up required"
  When I re-authenticate and change it
  Then a notice is sent to my OLD address and to the new one
```

*Answers:* T1, T5, AP2, PT-18 · *Tests:* TC-02, TC-29 · *Builds:* REM-03, REM-21

### MC-03 · An attacker forges payments and the payment schedule

> *As a borrower (or anyone), I craft a payment request that sets my next due date to 2099, my amount due to zero, and my streak to 999.*

**SR-03 (P0).** The system **shall** decide the outcome of a payment, including the new balance, the next due date and amount, the payment count and the streak, **on the server**. The client **shall** send only intent (amount, funding source, apply-to).

**SR-04 (P0).** The system **shall** generate payment references on the server, and **shall** record a given idempotency key at most once.

```gherkin
Scenario: forged schedule fields are ignored
  Given I am logged in as bob with a next due date of 2026-08-01
  When I POST a payment that includes nextPaymentDate 2099-12-31 and paymentsMade 999
  Then the stored schedule is the one the server computed, not the one I sent

Scenario: replay
  When I send the same request twice with the same idempotency key
  Then exactly one ledger row exists and the second response repeats the first result
```

*Answers:* T3, T4, AP3 · *Tests:* TC-10, TC-11 · *Builds:* REM-05 · *Observed today:* the forged request was **accepted** (TC-10).

### MC-04 · An attacker guesses passwords

> *As an anonymous caller, I try thousands of passwords against known usernames.*

**SR-05 (P0).** The system **shall** limit login attempts per account and per source, **shall** apply a temporary, self-expiring cool-down after repeated failures, and **shall** answer every failure identically.

**SR-06 (P0).** The system **shall** store passwords only as salted, slow hashes and **shall not** contain any plain-text password in the database, the repository or the documentation.

```gherkin
Scenario: lockout
  When I send 5 wrong passwords for alice
  Then the 6th attempt is refused for 15 minutes even with the correct password
  And the response body and status are the same as for any other failure

Scenario: no plain text
  When I read the user_authentication table
  Then every password value is a salted hash, not the password
```

*Answers:* T2, T6, AP4, AP5 · *Tests:* TC-03, TC-05, TC-31 · *Builds:* REM-02, REM-06

### MC-05 · An attacker works out which usernames exist

> *As an anonymous caller, I compare responses to find real usernames.*

**SR-07 (P0).** The system **shall** give identical responses (status, body and timing class) for an unknown identifier and for one the caller may not access.

*Answers:* R19, PT-03, PT-07 · *Tests:* TC-04 · *Builds:* REM-03

### MC-06 · An attacker reads traffic or abuses a website visit

> *As a network attacker, I read or alter plain HTTP. As a hostile website, I call the API from a visitor's browser.*

**SR-08 (P0).** The system **shall** be reachable only over TLS 1.2 or later and **shall** send `Strict-Transport-Security`.

**SR-09 (P0).** The system **shall** refuse state-changing requests that lack a valid CSRF token or whose `Origin` is not the application's own, **shall** accept `application/json` only, and **shall not** grant cross-origin access (no `Access-Control-Allow-Origin: *`).

```gherkin
Scenario: foreign origin
  Given I am a page served from https://evil.example
  When I send a text/plain POST or a cross-origin GET to the API
  Then the request is refused and no CORS grant is returned

Scenario: missing token
  Given I have a valid session
  When I send a write without the CSRF token
  Then the response is 403 and nothing is written
```

*Answers:* T8, R21, AP6, AP10 · *Tests:* TC-07, TC-08, TC-09, TC-28 · *Builds:* REM-04, REM-07, REM-19

### MC-07 · An attacker floods the service

> *As an anonymous caller, I send thousands of write requests.*

**SR-10 (P1).** The system **shall** shed excess load with `429` before it reaches the database, **shall** apply request and header timeouts, and **shall** cap body sizes.

*Answers:* T11, AP8 · *Tests:* TC-14, TC-15 · *Builds:* REM-09

### MC-08 · An attacker abuses the Azure relay

> *As anyone who can reach the dev server, I send prompts through the Azure route and let the owner pay.*

**SR-11 (P1).** The system **shall** require authentication on any route that reaches a paid or external service, **shall** rate-limit it per borrower, and **shall** enforce a spend budget with alerts.

**SR-12 (P1).** The system **shall not** send a borrower's personal or financial data to a third party without documented consent and approved terms, and **shall** minimise what is sent.

*Answers:* R20, T9, T10, AP9, PT-11, PT-16 · *Tests:* TC-18, TC-19, TC-20 · *Builds:* REM-10, REM-17

### MC-09 · An attacker (or an insider) denies or hides what happened

> *As an actor, I change data and later deny it, or I read data and leave no trace.*

**SR-13 (P0).** The system **shall** record an audit event for every authentication outcome, authorisation denial and write, naming the actor, source and outcome, in storage the application cannot alter, **without** logging passwords, tokens or personal values.

```gherkin
Scenario: audit trail
  When a borrower changes their email
  Then an audit record exists with actor, source IP, endpoint, fields changed and outcome
  And the record does not contain the old or new email address
```

*Answers:* T5, PT-14 · *Tests:* TC-13 · *Builds:* REM-08, REM-16

### MC-10 · An attacker tampers with or destroys the ledger

> *As an attacker with write access, I alter or delete history; or an operator mistake wipes it.*

**SR-14 (P1).** The system **shall** keep encrypted, tested backups, **shall** refuse destructive schema operations against a database holding real data, and **shall** reconcile the ledger against balances at least nightly.

*Answers:* R17, AP3 · *Tests:* TC-22, TC-26, TC-27 · *Builds:* REM-12

### MC-11 · An attacker steals the database file

> *As someone with file or backup access, I copy the database.*

**SR-15 (P1).** The system **shall** encrypt personal data at rest and **shall** restrict the database file to the service account.

*Answers:* R16, T6, PT-12 · *Tests:* TC-23 · *Builds:* REM-13

### MC-12 · An attacker uses a vulnerable dependency

> *As a supply-chain attacker, I compromise or exploit a package.*

**SR-16 (P1).** The build **shall** fail on a high or critical advisory in a runtime package, **shall** install exactly the locked versions, and **shall** produce an up-to-date SBOM.

*Answers:* T15, AP7 · *Tests:* TC-21 · *Builds:* REM-11, REM-14

### MC-13 · A website watches the app's visitors

> *As a third party serving a resource, I learn who visits.*

**SR-17 (P1).** The application **shall** load no third-party resources at run time and **shall** enforce a Content-Security-Policy that says so.

*Answers:* R22, PT-02 · *Tests:* TC-08, TC-24 · *Builds:* REM-15

### MC-14 · A borrower cannot see, correct or remove their data

> *As a borrower, I want to know what is held about me and to fix or remove it where allowed.*

**SR-18 (P2).** The system **shall** show a borrower the personal information held about them, **shall** let them correct it, and **shall** delete data that is past its retention period.

*Answers:* PT-06, PT-15 – PT-17, PT-19, PT-20 · *Tests:* manual review against the privacy impact assessment · *Builds:* REM-17

### MC-15 · A fix quietly regresses

> *As nobody in particular, a later change reopens a hole that was closed, and nothing notices.*

**SR-27 (P1).** Security tests **shall** run automatically on every change, and the build **shall** fail when an access-control, tampering, cross-site or injection test regresses.

```gherkin
Scenario: a regression is caught
  Given the authorisation tests TC-01 to TC-04 pass on the main branch
  When a change makes an endpoint readable without a session
  Then the build fails and names the failing test
```

*Answers:* R18 · *Tests:* the whole [test plan](security-test-plan.md) in CI · *Builds:* REM-14

---

## 2. Requirements that must **keep** holding

These describe controls that work today. They are requirements too: a change that breaks one is a defect.

| ID | Requirement | Why it matters | Test |
|---|---|---|---|
| **SR-19** | **Every database statement shall be parameterised**; request text is never concatenated into SQL. | T13 | TC-17 |
| **SR-20** | **Request size shall be bounded**: bodies at 16 KB; classify text at 2,000 characters. | T11, T12 | TC-15 |
| **SR-21** | **The keyword router shall run in bounded time** on any bounded input: wildcards limited to 3 words, fixed patterns. | T12 | TC-16 |
| **SR-22** | **A model proposes; the core decides.** Model output shall be limited to a topic label validated against the core's list, or prose shown as plain text, and shall never reach SQL, money, markup or the determinism policy. | T14, LLM01, LLM05 | TC-30 |
| **SR-23** | **A stale write shall be refused**: a payment whose expected balance does not match the stored balance is rejected with `409` and writes nothing. | T3 | TC-12 |
| **SR-24** | **The password shall never be returned** by any endpoint. | T6 | TC-06 |
| **SR-25** | **Login failures shall use one message** for an unknown user and a wrong password. | R19 | TC-04 |
| **SR-26** | **No secret shall appear in the browser bundle** in proxy mode; the Azure key lives only in the proxy's or API's environment. | T9 | TC-19 |

---

## 3. Coverage

| Check | Result |
|---|---|
| Every risk in the [register](itsg-33-risk-register.md) is answered by at least one SR | T1–T11, T15, R16–R22 → SR-01 to SR-18 and SR-27; T12–T14 → SR-19 to SR-22 |
| Every SR has a test ID | Yes, except SR-18, which needs a manual review against the privacy impact assessment |
| Every SR names a work item or an existing control | Yes |
| Count | 27 requirements: 19 to build (SR-01 to SR-18 and SR-27), 8 to keep (SR-19 to SR-26) |
