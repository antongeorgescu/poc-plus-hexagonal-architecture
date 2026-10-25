# Privacy threat model (LINDDUN)

**System:** Hexagonal Student-Loan POC · **Reviewed:** 2026-10-25 · **Basis:** the schema and code on branch `keyword-search`
**Complements:** the STRIDE-based [threat model](threat-model.png) and the [ITSG-33 risk register](itsg-33-risk-register.md)
**Inputs:** [data-inventory-and-categorization.md](data-inventory-and-categorization.md)

STRIDE asks *"can someone attack the system?"* LINDDUN asks a different question: ***"can the system harm the people whose data it holds, even if nobody attacks it?"*** That matters here because the system holds personal and financial information about identifiable borrowers, including a record of missed payments and an emotional recap of their conversations.

LINDDUN has seven categories: **L**inking, **I**dentifying, **N**on-repudiation, **D**etecting, **D**ata disclosure, **U**nawareness and unintervenability, and **N**on-compliance. Each is applied below to what this system actually does. Privacy threats get their own IDs, **PT-nn**, and point to the security threats (T, R) that share a cause.

> This is a design-time analysis, not a legal opinion. Which privacy law and which obligations apply depend on who operates the system; confirm with the privacy officer.

---

## 1. Findings

Rating is *High / Medium / Low* for the harm to a borrower, as in the other documents.

### L — Linking: joining separate facts about one person

| ID | Threat | Evidence | Rating | Mitigation | REM |
|---|---|---|---|---|---|
| **PT-01** | The ledger, contact history and chat recap are all keyed to the same borrower, so anyone who can read them can **join them into one profile**: finances, places lived (address history) and emotional state. Because reads need no login, that is anyone (T7). | `payment_history`, `profile_update_history` and `chat_history` all reference `borrower`; the three `GET` endpoints take only a username | **High** | Authenticate and scope every read (AC); never expose several categories through one call; minimise what is stored | REM-01, 03, 17 |
| **PT-02** | Every page view asks Google Fonts for a stylesheet, which can link visits to a visitor's IP address across sites. | [index.html:10](../src/index.html#L10) | Low | Self-host the fonts | REM-15 |

### I — Identifying: working out who someone is

| ID | Threat | Evidence | Rating | Mitigation | REM |
|---|---|---|---|---|---|
| **PT-03** | **Usernames can be confirmed**: an unknown name returns 404, a real one 200 (R19). An attacker can build a list of real borrowers. | TC-04 in the [test plan](security-test-plan.md) | Medium | Answer unknown and unauthorised identically | REM-03 |
| **PT-04** | **The identifier travels in the URL.** `GET /api/payments/history?username=alice` puts a borrower's identifier in browser history, server and proxy logs, and the `Referer` header. | The history, chat and job endpoints use query strings | Medium | Take the borrower from the session; keep identifiers out of URLs | REM-03 |
| **PT-05** | Contact snapshots stored in full for every update make a person **re-identifiable over time** even if the current record is later deleted. | `profile_update_history` stores the full email, phone and address each time | Medium | Store only the changed field, or only a hash and the field name; apply retention | REM-17 |

### N — Non-repudiation: being unable to deny, or to erase

| ID | Threat | Evidence | Rating | Mitigation | REM |
|---|---|---|---|---|---|
| **PT-06** | Nothing is ever deleted. A borrower cannot have **chat recaps, old contact values or the credit score** removed, although unlike the payment ledger they have no need to be kept forever. | No delete path or retention job exists | Medium | Define retention per table; delete on schedule; keep the ledger (a financial record) but not the rest | REM-17 |

### D — Detecting: inferring that someone is a customer, or what they did

| ID | Threat | Evidence | Rating | Mitigation | REM |
|---|---|---|---|---|---|
| **PT-07** | **The existence of an account is detectable** (PT-03), and so is the existence of history or a chat recap: an empty result and a populated one look different. | The history endpoints return an empty list or a populated one | Low | Uniform responses; authentication before any lookup | REM-03 |

### D — Data disclosure: personal data reaching those who should not have it

| ID | Threat | Evidence | Rating | Mitigation | REM |
|---|---|---|---|---|---|
| **PT-08** | **Anyone can read any borrower's data** — name, contact details, credit score, balances, ledger, chat recap (T1, T7). | TC-01 | **High** | The access-control design in [authn-authz-design.md](authn-authz-design.md) | REM-01, 03 |
| **PT-09** | **Any website can read it from a visitor's browser** (R21). | TC-09 | **High** | CSRF and CORS fixes | REM-04 |
| **PT-10** | **Plain-text passwords** in the database, the seed file and the README (T6). | [schema.sql:106](../db/schema.sql#L106) | **High** | Hashing; clean the repository | REM-02 |
| **PT-11** | **Exact balances, rates, due dates and payment history go to Azure** when it is enabled (T10). | [azure-ai-language-model.ts:129](../src/app/adapters/driven/azure-ai-language-model.ts#L129), [:168](../src/app/adapters/driven/azure-ai-language-model.ts#L168) | Medium (off by default) | Round or relativise the figures; consent; approved terms | REM-10, 17 |
| **PT-12** | **An unencrypted, world-readable database file** (R16), and **no encrypted backup** to move it safely (R17). | TC-23, TC-22 | Medium | Encrypt at rest; encrypted backups | REM-12, 13 |
| **PT-13** | **Personal data in the repository**: names, addresses, emails and phones of six synthetic borrowers sit in `seed-data.mjs`. Harmless today; a habit that would leak if real data were loaded the same way. | [seed-data.mjs](../db/seed-data.mjs), [build.mjs](../db/build.mjs) | Low | Load real data only from a secured source, never from the repository | REM-02 |
| **PT-14** | **No request log means no way to know** who read what — so a disclosure could not even be detected, let alone reported (T5). | TC-13 | Medium | Audit log without personal values | REM-08 |

### U — Unawareness and unintervenability: people cannot see, understand or control what happens to their data

| ID | Threat | Evidence | Rating | Mitigation | REM |
|---|---|---|---|---|---|
| **PT-15** | **No privacy notice.** Borrowers are not told what is collected, why, who sees it or how long it is kept. | None in the UI or docs | Medium | Write and show a notice; link it from the login page | REM-17 |
| **PT-16** | **No consent or notice for sending data to Azure.** Borrowers could not know that a question or their figures may leave the system. | The adapter has no consent check | Medium | Consent before enabling; disclosure in the notice | REM-10, 17 |
| **PT-17** | **Borrowers cannot see or correct most of their data**: only contact details are editable; credit score, standing, ledger and chat recap are not shown with a correction route. | Update Profile covers email, phone, address only | Medium | A view-and-correct process; an export | REM-17 |
| **PT-18** | **A borrower is not told when their contact details change**, so a hijack (AP2) can go unnoticed. | SD-5 in the [sequence diagrams](sequence-diagrams.md) | Medium | Notify the old and new addresses | REM-21 |

### N — Non-compliance: not meeting privacy obligations

| ID | Threat | Evidence | Rating | Mitigation | REM |
|---|---|---|---|---|---|
| **PT-19** | **No privacy impact assessment** for a system that collects and uses personal information. | None exists | Medium | Complete one before real data is used | REM-17 |
| **PT-20** | **No retention schedule and no deletion process.** | PT-06 | Medium | Set periods with the privacy officer | REM-17 |
| **PT-21** | **Third-party processing is undocumented** (Azure, Google Fonts). | [dependency-and-vendor-review.md](dependency-and-vendor-review.md) | Medium | Record each processor, purpose, location and terms | REM-17 |
| **PT-22** | **No breach process.** If personal information were exposed there is no defined way to assess, record or report it. | [logging-incident-recovery.md](logging-incident-recovery.md) | Medium | Incident plan and privacy-officer role | REM-16 |

---

## 2. Summary

| Category | Findings | Highest |
|---|---|---|
| Linking | PT-01, PT-02 | High |
| Identifying | PT-03, PT-04, PT-05 | Medium |
| Non-repudiation | PT-06 | Medium |
| Detecting | PT-07 | Low |
| Data disclosure | PT-08 – PT-14 | **High** |
| Unawareness and unintervenability | PT-15 – PT-18 | Medium |
| Non-compliance | PT-19 – PT-22 | Medium |

**The pattern.** The three *High* privacy findings (PT-01, PT-08, PT-09) and PT-10 share causes with the security findings T1, T7, T6 and R21, so **the security fixes in Phase 0 also fix most of the privacy risk**. What the security work does *not* cover is the **governance** half: notice, consent, retention, correction, a privacy impact assessment, and a breach process. Those need the privacy officer, not just developers.

---

## 3. Privacy by design: what to build in

| Principle | Concretely, for this system |
|---|---|
| **Minimise** | Drop the credit score from the portal unless a feature needs it. Store only what changed in the contact history. Keep chat recaps only as long as they are useful. |
| **Separate** | Do not return ledger, contact history and chat recap from one call or to one role by default; support roles read one category at a time, with a recorded reason. |
| **Keep identifiers out of URLs** | The borrower comes from the session. |
| **Limit sharing** | No third-party requests from the page; Azure only with consent and minimised data. |
| **Be transparent** | A privacy notice; a notification when contact details change; a way to see and correct personal information. |
| **Delete on schedule** | A retention period per table and a job that enforces it, including in backups. |
| **Log without exposing** | Audit records name the actor and the field, never the value. |

---

## 4. Decisions for the privacy officer

1. Which privacy regime applies, and what does it require for notice, consent, access, correction and breach reporting?
2. Retention period for each table (ledger, contact history, chat recaps, credit score).
3. Whether the credit score and full contact snapshots are necessary at all.
4. Whether Azure OpenAI may ever process borrower data, and under what terms.
5. Who may see a borrower's data besides the borrower, and under what controls.

Record the answers in [remediation-plan.md](remediation-plan.md) (REM-17) and update the [data inventory](data-inventory-and-categorization.md).
