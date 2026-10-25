# Logging, incident response and recovery requirements

**System:** Hexagonal Student-Loan POC · **Status:** requirements and runbook outline (nothing here is implemented yet)
**Closes:** T5, R17 · gives detection for AP1–AP4, AP8, AP10
**ITSG-33 families:** AU (Audit and Accountability) · IR (Incident Response) · CP (Contingency Planning) · SI-4 (Information System Monitoring)

You cannot respond to what you cannot see. Today the API writes **one line at startup and prints unexpected errors** ([api.mjs:322](../server/api.mjs#L322), [:324](../server/api.mjs#L324)); it records nothing per request, and the history tables record a reference and a time but not *who* ([schema.sql:56](../db/schema.sql#L56)). This document defines what to record, what to alert on, what to do when an alert fires, and how to recover.

> **Owners and numbers are proposals.** Retention periods, recovery targets and notification duties depend on the data classification and the legal regime that applies. Confirm them with the system owner and the privacy officer ([data-inventory-and-categorization.md](data-inventory-and-categorization.md)).

---

## 1. Logging requirements (AU)

### 1.1 What to record

One **audit event** for each security-relevant action. Minimum set:

| Event | When | Severity | Maps to |
|---|---|---|---|
| `auth.login.success` | A login succeeds | info | AP4 |
| `auth.login.failure` | A login fails (record the reason internally, not to the caller) | warn | T2, AP4 |
| `auth.lockout` | A lockout starts | warn | T2 |
| `auth.logout` · `auth.session.expired` | Session ends | info | — |
| `auth.stepup.success` · `auth.stepup.failure` | Re-authentication for a risky change | info / warn | AP2 |
| `authz.denied` | A valid session asks for something it may not have | **alert** | T1, T7 |
| `data.read` | A ledger, contact history or chat recap is read | info | AP1 |
| `data.read.bulk` | One session reads many distinct borrowers or many records in a short time | **alert** | AP1 |
| `profile.change` | Contact details change (fields changed, not values) | info | AP2 |
| `payment.recorded` | A payment is recorded (amount, reference, outcome) | info | AP3 |
| `payment.rejected` | A payment is refused (reason class) | warn | AP3 |
| `request.invalid` | Malformed body, wrong content type, bad `Origin`, missing CSRF token | warn | R21, AP10 |
| `rate.limited` | A limit was applied | warn | T11, AP8 |
| `azure.call` | A call to Azure OpenAI (operation, size, duration, cost estimate) | info | T10, R20 |
| `config.change` · `deploy` | Configuration or deployment changes | info | T15 |
| `admin.access` | An administrator opens a host or the database | **alert** | — |

### 1.2 What every record contains (AU-3)

```json
{
  "ts": "2026-10-25T15:42:37.412Z",          // UTC, synchronised clock (AU-8)
  "event": "profile.change",
  "outcome": "success",                       // success | failure | denied
  "requestId": "01HF...",                     // links records for one request
  "actor": { "type": "borrower", "id": "b-0007", "sessionId": "s-hash-prefix" },
  "source": { "ip": "203.0.113.9", "userAgent": "Mozilla/5.0 ..." },
  "target": { "type": "borrower_contact", "id": "b-0007", "fields": ["email"] },
  "method": "POST", "path": "/api/profile", "status": 200, "durationMs": 41
}
```

### 1.3 What must **not** be logged

Passwords, password hashes, session identifiers (log only a short hash prefix), CSRF tokens, the Azure key, full request bodies, and personal data values (log *which field changed*, not the new email address). The question text a borrower types is personal; log its length and the topic chosen, not the words.

### 1.4 Handling the logs (AU-9, AU-11)

| Requirement | Proposal |
|---|---|
| Separate from the application | Ship records to a log service the API cannot edit or delete (append-only). |
| Integrity | Tamper-evident storage (write-once, or hash-chained). Restrict who can read. |
| Retention | Hot (searchable) **90 days**; archive **1 year**. The owner sets the real period. |
| Time | Synchronised clocks on every host. |
| Failure | If audit logging fails for a **write**, the write fails (fail closed), so a gap cannot be exploited. |
| Access to logs | A role separate from administrators and developers; reads are themselves logged. |

### 1.5 Accountability on the data itself

Add `created_by` (the borrower or support actor id) and `request_id` to `payment_history` and `profile_update_history`, so a ledger row can be tied back to the audit record (AU-10, non-repudiation).

---

## 2. Detection use cases (SI-4, IR-5)

Each detection names the attack path it watches for. Thresholds are starting points to tune against real traffic.

| ID | Detection | Rule (starting point) | Watches | Severity |
|---|---|---|---|---|
| **DET-01** | Password guessing | ≥ 10 `auth.login.failure` for one account in 5 minutes, or ≥ 50 from one IP in 5 minutes | AP4 | High |
| **DET-02** | Success after many failures | A `login.success` within 10 minutes of ≥ 5 failures on that account | AP4 | High |
| **DET-03** | Username enumeration | ≥ 20 distinct usernames tried, or ≥ 20 identical-shaped "not found" answers, from one source in 5 minutes | AP1, AP4 | Medium |
| **DET-04** | Broken access control | Any `authz.denied` | AP1 | High |
| **DET-05** | Bulk read | One session reads records of more than a handful of borrowers, or many records in a minute | AP1 | High |
| **DET-06** | Contact change then money | `profile.change` followed by `payment.recorded` within 24 hours on the same account | AP2, AP3 | High |
| **DET-07** | Contact changed from a new device or IP | `profile.change` where the source differs from the account's recent logins | AP2 | Medium |
| **DET-08** | Payment anomaly | A payment far above the borrower's norm; a payment that moves the due date more than one period | AP3 | High |
| **DET-09** | Cross-site attempts | ≥ 5 `request.invalid` with a foreign `Origin` or `text/plain` writes in 5 minutes | AP10 | Medium |
| **DET-10** | Request flood | Request rate or `rate.limited` count above baseline | AP8 | Medium |
| **DET-11** | Azure spend or relay use | `azure.call` volume or cost above budget; any call without a session | AP9 | Medium |
| **DET-12** | Integrity drift | Nightly ledger reconciliation (section 4.3) returns any row | AP3 | High |
| **DET-13** | New advisory | A new high or critical advisory in a runtime package | AP7 | Medium |

---

## 3. Incident response (IR)

### 3.1 Roles

| Role | Responsibility |
|---|---|
| **Incident lead** | Runs the response, makes containment decisions, keeps the timeline. |
| **Technical responder** | Investigates, contains and recovers. |
| **System owner** | Decides on business impact, service shutdown and borrower notification. |
| **Privacy officer** | Assesses privacy impact and any duty to notify. |
| **Communications** | Drafts borrower and stakeholder messages. |

### 3.2 Severity

| Level | Meaning | Respond within |
|---|---|---|
| **1 — Critical** | Confirmed unauthorised access to borrower data, confirmed ledger tampering, credential database exposed | Immediately; start containment |
| **2 — High** | Likely compromise or an attack in progress (DET-01, 02, 04, 05, 06, 08) | 1 hour |
| **3 — Medium** | Suspicious activity, no confirmed harm (DET-03, 07, 09, 10, 11) | Same business day |
| **4 — Low** | Informational | Next review |

### 3.3 Phases

1. **Detect and triage** — confirm the alert is real; set severity; open an incident record; start a timeline.
2. **Contain** — stop the harm first: revoke the affected sessions, lock affected accounts, block the source, disable the endpoint or the whole service if needed. Preserve logs and a copy of the database before changing anything.
3. **Eradicate** — remove the cause: patch the flaw, rotate every exposed secret, remove the attacker's changes.
4. **Recover** — restore from a known-good state (section 4), reconcile the ledger, return to service in stages, watch closely.
5. **Notify** — borrowers, the owner, and any authority the privacy officer says must be told (section 3.5).
6. **Learn** — a blameless review within a week: what happened, what detected it, what was slow, what changes. Update the [risk register](itsg-33-risk-register.md), the [test plan](security-test-plan.md) and these detections.

### 3.4 Playbooks

| ID | Situation | First actions |
|---|---|---|
| **PB-1** | **Account takeover** (DET-01, 02, 06, 07) | Revoke all sessions for the account; lock it; restore contact details from `profile_update_history`; check the ledger for payments since the takeover; contact the borrower through a channel known to be theirs; force a password reset. |
| **PB-2** | **Data exposure** (DET-04, 05; AP1, AP10) | Contain the endpoint; identify which borrowers' data was read and which fields, from the audit log; preserve evidence; hand to the privacy officer immediately. |
| **PB-3** | **Ledger tampering** (DET-08, 12; AP3) | Freeze writes; run the reconciliation (4.3); identify altered rows by actor and time; restore from backup or correct by reversing entries, never by editing history; reconcile again. |
| **PB-4** | **Credential leak** (AP5) | Treat every credential as compromised: force resets, rotate the Azure key and any database credentials, find and close the leak (repository, backup, laptop). |
| **PB-5** | **Denial of service** (DET-10; AP8) | Tighten edge limits; block sources; scale or shed load; keep the audit log writing. |
| **PB-6** | **Azure misuse** (DET-11; AP9) | Rotate the key; remove or authenticate the route; check the provider's usage and billing; review what was sent. |

### 3.5 Notification

If personal information may have been exposed, **the privacy officer decides** who must be told and when. In general that means assessing whether there is a real risk of significant harm to the people affected and recording that assessment either way. The legal duties depend on who operates the system (a federal institution and a private-sector lender are covered differently); this document does not state them. Prepare in advance: a contact list, template messages to borrowers, and the facts the authority will ask for (what, when, how many people, what data, what was done).

### 3.6 Drills

Run each playbook as a tabletop exercise before launch and at least yearly. A detection that has never fired in a drill is not yet a detection.

---

## 4. Backup and recovery (CP)

Today there is **no backup**, and `npm run db:build` drops and recreates every table ([schema.sql:4-12](../db/schema.sql#L4-L12)), erasing payments and profile updates made through the app (R17).

### 4.1 Targets (proposals)

| Target | Proposal | Why |
|---|---|---|
| **RPO** (data you can afford to lose) | **15 minutes** for the ledger and contact data | Payments are financial records; losing them is hard to reconstruct. |
| **RTO** (time to restore service) | **4 hours** | A self-service portal outage is an inconvenience if another channel exists. |

The owner should confirm both after the availability decision in the data-inventory document.

### 4.2 Requirements

| Requirement | Detail |
|---|---|
| What is backed up | The database (all tables, including both history ledgers) and the configuration. Not secrets: those live in the secrets manager. |
| How | Online snapshot of the SQLite file (`VACUUM INTO` or the backup API) every 15 minutes, plus a daily full copy; or continuous log shipping if the database changes. |
| Protection | Encrypted; stored in a **separate account or location** from the live data; access separate from the administrators who can delete production. |
| Retention | Aligned to the data retention schedule (so deleted data does not live forever in backups). |
| Guard on `db:build` | Refuse to run against a database that holds real data, unless an explicit, logged override is given. |
| Restore tests | **Quarterly**: restore into a clean environment, run the integrity checks, and time it. |

### 4.3 Integrity checks and the ledger reconciliation

The history tables were designed to be checkable: each `payment_history` row stores the balance after the payment, so the last row must equal the loan's current balance. Run this nightly and after every restore. **It returned 0 rows on 2026-10-25**, and `PRAGMA integrity_check` returned `ok` with no foreign-key violations ([security-test-plan.md](security-test-plan.md), TC-26).

```sql
-- every row returned is a loan whose ledger and balance disagree: raise DET-12
SELECT a.username, l.current_balance,
       (SELECT h.balance_after FROM payment_history h
         WHERE h.loan_id = l.loan_id ORDER BY h.payment_history_id DESC LIMIT 1) AS last_balance_after
  FROM loan l JOIN user_authentication a USING (borrower_id)
 WHERE last_balance_after IS NOT NULL
   AND ABS(last_balance_after - l.current_balance) > 0.005;

PRAGMA integrity_check;     -- expect: ok
PRAGMA foreign_key_check;   -- expect: no rows
```

> **A known limit.** This catches a balance that disagrees with the ledger. It does **not** catch a forged *schedule* (next due date, amount, streak): see TC-10, where those fields were accepted freely. The structural fix is to compute the schedule on the server (REM-05). Until then, also compare `payments_made` with the number of ledger rows over a period.

### 4.4 Restore runbook (outline)

1. Declare the incident and stop writes (take the API out of service).
2. Preserve the current database and logs for investigation.
3. Choose the restore point: the latest backup **before** the first suspicious event in the audit log.
4. Restore into a clean environment; run `integrity_check` and the reconciliation.
5. Replay or manually reapply legitimate changes made after the restore point (the audit log lists them).
6. Rotate credentials if the cause was a compromise.
7. Return to service in stages; watch DET-01 to DET-12 closely for a day.
8. Record RTO and RPO actually achieved, and review.

---

## 5. Implementation order

| Step | REM item | Result |
|---|---|---|
| 1 | REM-01 (sessions) | Gives `actor` for every record. |
| 2 | REM-08 | The audit log of section 1. |
| 3 | REM-12 | Backups, the `db:build` guard, restore tests and the nightly reconciliation. |
| 4 | REM-16 | The detections of section 2 and the incident plan of section 3. |
| 5 | Drills | One tabletop exercise per playbook before launch. |

## 6. Controls satisfied

| ITSG-33 control | How |
|---|---|
| **AU-2, AU-3, AU-12** | Event catalogue, record contents, generation on every relevant action. |
| **AU-6, SI-4** | Detections DET-01 to DET-13 with review and alerting. |
| **AU-8, AU-9, AU-11** | Synchronised time, protected and retained logs. |
| **AU-10** | Actor and request id on ledger rows. |
| **IR-4, IR-5, IR-6** | Phases, monitoring and reporting in section 3. |
| **CP-9, CP-10** | Backups and restoration in section 4. |
