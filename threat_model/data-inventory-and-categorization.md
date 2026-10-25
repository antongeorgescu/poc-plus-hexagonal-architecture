# Data inventory and security categorization

**System:** Hexagonal Student-Loan POC · **Basis:** the schema and code on branch `keyword-search` · **Status:** *proposal for the system owner to confirm*

This document answers three questions the other threat-model documents assume but never settle: **what data does the system hold, where does it go, and how sensitive is it?** The answers drive the choice of an ITSG-33 control profile (see [itsg-33-risk-register.md](itsg-33-risk-register.md)) and are the input a privacy impact assessment needs.

> **Everything marked "proposed" is a recommendation, not a decision.** Classification and categorization are the system owner's call, made with the privacy officer and the security authority. The data in the repository today is synthetic demo data; the analysis is for the real data the design is built to hold.

---

## 1. Data inventory

Every stored field, from [db/schema.sql](../db/schema.sql). "Who can read it today" reflects the API as built, where **any caller who supplies a username can read any borrower's data** (T1, T7).

### 1.1 Stored data

| Data element | Table.column | Personal? | Proposed class | Who can read it today | Leaves the boundary? |
|---|---|---|---|---|---|
| First and last name | `borrower.first_name`, `last_name` | Yes | Protected B (with the rest of the record) | Any caller (login, history responses) | First name → Azure, if enabled |
| Program of study | `borrower.program_of_study` | Yes (in context) | Protected B | Any caller | → Azure (loan narration), if enabled |
| City, province | `borrower.city`, `province` | Yes | Protected B | Any caller | No |
| **Credit score** | `borrower.credit_score` | Yes — financial | **Protected B** | Any caller (login response) | No |
| Standing tier (1–3) | `borrower.user_type` | Yes — reveals delinquency | Protected B | Any caller | → Azure (welcome copy), if enabled |
| **Email, phone, mailing address** | `borrower_contact.*` | Yes — direct identifiers | **Protected B** | Any caller | No |
| **Every past contact value** | `profile_update_history.email`, `phone`, `mailing_address` | Yes — full snapshots | Protected B | Any caller (`/api/profile/history`) | No |
| Username | `user_authentication.username` | Yes — identifier | Protected B | Anyone can confirm it exists (R19) | No |
| **Password** | `user_authentication.password` | Authenticator | **Protected B or higher** | The database file; never returned by the API | No |
| Loan amounts and rate | `loan.original_amount`, `current_balance`, `interest_rate`, `monthly_payment`, `maturity_date` | Yes — financial | **Protected B** | Any caller | → Azure (loan narration), if enabled |
| Payment schedule and record | `payment.*` (due date and amount, made, missed, streak) | Yes — shows missed payments | Protected B | Any caller | → Azure (payment narration), if enabled |
| **Payment ledger** | `payment_history.*` (reference, amount, funding-source label, apply-to, date, balance after) | Yes — financial | **Protected B** | Any caller (`/api/payments/history`) | No |
| **Chat recap and tone** | `chat_history.summary`, `tone_score`, counts, last contact | Yes — **behavioural and emotional** (distress, frustration) | **Protected B** | Any caller (`/api/chat-history`) | No |
| Job postings | `job_posting.*` | No (synthetic public catalogue) | Unclassified | Any caller | No |

### 1.2 Transient data (not stored by the system)

| Data | Where it exists | Notes |
|---|---|---|
| The borrower record (without password) | Browser memory (the session store) | No token or cookie; lost on reload. |
| The borrower's **question text** | Sent to `POST /api/language-model/classify`; processed in memory | Not stored or logged today (there is no request logging, which is itself a gap — T5). Sent to Azure if enabled. |
| Figures used for narration | Built in the browser, sent to the API's language-model routes | Loan and payment figures; handled in memory. Sent to Azure if enabled. |
| Request bodies | API process memory | Capped at 16 KB ([api.mjs:305](../server/api.mjs#L305)); not retained. |

### 1.3 Data in other places

| Place | What is there | Concern |
|---|---|---|
| **Git repository** | [db/seed-data.mjs](../db/seed-data.mjs) and [db/build.mjs](../db/build.mjs): six synthetic borrowers with names, addresses, emails, phones, loan figures and the shared password `demo123`; the README repeats the password | Synthetic today. If real data is ever loaded this way, it lands in version control (T6, AP5). |
| **SQLite file** | Everything in 1.1, unencrypted | R16. Git-ignored, so not committed ([.gitignore:13](../.gitignore#L13)). |
| **Azure OpenAI** (optional, off by default) | See section 3 | T10. |
| **Software bill of materials** | Package names and versions only | No personal data. See [sbom.cdx.json](sbom.cdx.json). |

---

## 2. Data flows

| # | Flow | Data | Protection today |
|---|---|---|---|
| D1 | Borrower → browser | Credentials, questions, payment and profile forms | None needed (user's own device) |
| D2 | Browser → API (via the dev-server proxy) | Credentials; payment and profile requests; question text; figures for narration | Plain HTTP; loopback only (T8) |
| D3 | API → browser | The borrower record, ledgers, contact history, chat recap | Plain HTTP; **no authentication on the request** (T1, T7) |
| D4 | API ↔ SQLite | Everything in 1.1 | File permissions only; prepared statements (T13) |
| D5 | Browser → proxy → Azure | Question text, first name and tier, loan and payment figures | HTTPS to Azure; key held by the proxy (T9, T10, R20) |
| D6 | Browser → Google Fonts | A stylesheet request: the visitor's IP address and user agent | None (R22) |

---

## 3. What leaves the boundary when Azure is on

Azure OpenAI is **off by default**; the app uses the server-side keyword model. When it is enabled, the adapter sends the following (code references in [azure-ai-language-model.ts](../src/app/adapters/driven/azure-ai-language-model.ts)):

| Operation | Sent to Azure | Line |
|---|---|---|
| Classify a question | The borrower's **question text**, plus the business category descriptions | [:111](../src/app/adapters/driven/azure-ai-language-model.ts#L111) |
| Narrate the loan | Program of study, original and current balance, interest rate, % paid, months to maturity, maturity date | [:129](../src/app/adapters/driven/azure-ai-language-model.ts#L129) |
| Narrate payments | Monthly payment, next amount and date, payments made and missed, on-time streak, past-due flag and amount | [:168](../src/app/adapters/driven/azure-ai-language-model.ts#L168) |
| Describe tone | A sentiment label | [:187](../src/app/adapters/driven/azure-ai-language-model.ts#L187) |
| Welcome copy | **First name** and standing tier | [:210](../src/app/adapters/driven/azure-ai-language-model.ts#L210) |

Not sent: the password, email, phone, mailing address, credit score, username, ledgers, and chat recaps. **An earlier version of the threat model said only the question text and first name were sent; that was incomplete and is corrected** (see T10 in the register).

---

## 3a. Security categorization

ITSG-33 expects the system to be categorized (control **RA-2**, Security Categorization) before a control profile is chosen. The usual method asks, for each of confidentiality, integrity and availability: *what is the worst realistic injury if this is compromised?*

### Proposed categorization

| Objective | Proposed level | Reasoning |
|---|---|---|
| **Confidentiality** | **Medium** (Protected B) | Names, contact details, credit scores, balances and a record of missed payments for identifiable people. Disclosure could cause serious injury to an individual: fraud, harassment, discrimination, embarrassment. The chat recaps add emotional and hardship information. |
| **Integrity** | **Medium** | The payment ledger and loan schedule are financial records. A forged payment or altered schedule can misstate what a person owes or has paid, with direct financial consequences and difficulty proving what happened. |
| **Availability** | **Low to Medium** | A self-service portal outage is an inconvenience, not a safety or financial harm, *provided* borrowers have another channel. Medium if the portal is the only way to pay or to avoid a late fee. |

**Suggested overall: Protected B, Medium integrity, Medium availability** — a combination commonly written as a "Protected B / Medium / Medium" profile, with Low availability defensible if the outage tolerance is long. The owner should confirm both the classification and the availability level.

### What this implies

- The controls in the ITSG-33 [risk register](itsg-33-risk-register.md) become **requirements** for the selected profile, not options.
- The five High risks (T1, T2, T3, T6, T7) and R21 must be closed **before real borrower data is loaded**.
- Data-handling rules that follow from Protected B: encrypt in transit and at rest, restrict access to those who need it, log access, and keep backups to the same standard.

---

## 4. Privacy considerations

> This section lists questions, not legal conclusions. Which privacy regime applies depends on who operates the system; confirm with your privacy officer.

| Topic | Today | Open question or recommended step |
|---|---|---|
| **Privacy impact assessment** | None | The system collects and uses personal information, so a PIA is very likely required before real data is used. This inventory is its first input. |
| **Purpose and consent** | Not documented | State why each field is collected. Obtain consent (or confirm a legal authority) for sending data to Azure. |
| **Data minimisation** | Credit score, full contact snapshots, and chat recaps are stored | Is the credit score needed in the portal? Do history rows need *full* contact snapshots, or only the changed field? Do chat recaps need to be kept in full? |
| **Retention** | None defined; nothing is ever deleted | Define a retention period per table and a disposal process, including backups. |
| **Access, correction and deletion** | A borrower can update contact details; nothing else | Provide a way to see, correct and (where permitted) delete personal information, and to export it. |
| **Third-party processing** | Azure (optional); Google Fonts (R22) | Document each processor, its location, and its retention terms; see [dependency-and-vendor-review.md](dependency-and-vendor-review.md). |
| **Breach handling** | No process | See [logging-incident-recovery.md](logging-incident-recovery.md). |
| **Notice to borrowers** | None | Tell borrowers what is collected, why, who sees it, and how long it is kept. |

---

## 5. Decisions the owner needs to make

| # | Decision | Recommended default |
|---|---|---|
| 1 | Classification of the data | Protected B |
| 2 | Availability level | Medium, unless the outage tolerance is long |
| 3 | Is Azure OpenAI ever enabled for real borrowers? | No, until the data sent is minimised and consent and terms are in place |
| 4 | Retention period per table | To be set with the privacy officer; propose the shortest that meets the business purpose |
| 5 | Is the credit score needed in the portal? | Remove it unless a feature depends on it |
| 6 | Are full contact snapshots needed in the history? | Store only what changed |
| 7 | Who may see borrower data besides the borrower (support, administrators)? | Decide with the role matrix in [authn-authz-design.md](authn-authz-design.md) |

Once these are decided, record the outcome in the remediation plan ([remediation-plan.md](remediation-plan.md), REM-17 and REM-18).
