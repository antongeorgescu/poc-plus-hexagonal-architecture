# Risks and mitigations by ITSG-33 control family

**System:** Hexagonal Student-Loan POC (Angular 18 app, local Node API, SQLite)
**Basis:** the code as implemented on branch `keyword-search` — every finding below cites the file and line where it comes from.
**Companion diagrams:** [threat-model.png](threat-model.png) (data flow, trust boundaries, T1–T15) and [attack-paths.png](attack-paths.png) (AP1–AP9, controls C1–C9).

---

## 1. Purpose and how to read this

ITSG-33 (*IT Security Risk Management: A Lifecycle Approach*) is the Canadian Centre for Cyber Security's IT security risk management guidance. Its **Annex 3A** is a catalogue of security controls grouped into **families** (derived from NIST SP 800-53). This document does three things:

1. lists the risks found in this system, using the IDs from the threat model (**T1–T15**) plus seven more found while reading and testing the code (**R16–R22**);
2. files each risk under the ITSG-33 family that owns the fix, and names the specific controls;
3. says what the code does today and what to change, in order of priority.

**Scope.** The application as built: a single-machine demo with seeded data, reached on `localhost`. Risk is rated as if it were reachable beyond localhost, because that is the question a real deployment would ask.

**Rating.** *High / Medium / Low* combines likelihood and impact, as in the diagrams. These are judgement calls for the app as built, not a measured score.

### Assumptions to confirm

| Assumption | Why it matters |
|---|---|
| The data is demo data today, but the design handles borrower personal information (name, address, email, phone, credit score) and loan balances. | A real deployment would need a formal **categorization** (control RA-2, Security Categorization). Personal information of this kind is commonly treated as **Protected B**, which pulls in a *medium integrity, medium availability* control profile. |
| No security profile has been selected. | This document maps **families and control IDs only**. It does **not** claim compliance with any ITSG-33 profile. |
| Physical, personnel and organisation-level controls belong to the operating organisation, not to this code base. | Families PE, PS, PM, AT and MA are marked out of scope in section 4. |

> **Check before citing formally.** Control IDs follow Annex 3A, which derives from NIST SP 800-53 (Rev 3 lineage). Some IDs were merged in later NIST revisions (for example transmission integrity and confidentiality, SC-8 and SC-9). Verify the IDs and enhancements against the current published Annex 3A and against the profile you select.

---

## 2. Summary by control family

| Family | Class | Risks filed here | Highest rating | State in the code |
|---|---|---|---|---|
| **AC** Access Control | Technical | T1, T7, R19, R20, R21 | **High** | **Gap** — no access enforcement on the API |
| **IA** Identification and Authentication | Technical | T2, T6 | **High** | **Gap** — no sessions, plain-text passwords |
| **AU** Audit and Accountability | Technical | T5 | Medium | **Gap** — no request log, no actor on records |
| **SC** System and Communications Protection | Technical | T8, T9, T10, T11, R16, R22 | Medium | **Partial** — loopback bind and a body cap, but no TLS or rate limits |
| **SI** System and Information Integrity | Operational | T3, T12, T13, T15 | **High** (T3) | **Partial** — strong input validation, weak monitoring |
| **CM** Configuration Management | Operational | T9, T15 | Medium | **Partial** |
| **SA** System and Services Acquisition | Management | T3, T4, T15, R18 | **High** (T3) | **Partial** — decisions made on the client, one test suite |
| **RA** Risk Assessment | Management | — | — | **Partial** — this document; no scheduled scanning |
| **CA** Security Assessment and Authorization | Management | R18 | Medium | **Gap** — no formal assessment |
| **IR** Incident Response | Operational | (depends on AU, SI-4) | — | **Gap** — nothing to detect or report with |
| **CP** Contingency Planning | Operational | R17 | Medium | **Gap** — no backup |
| **MP** Media Protection | Operational | R16 | Medium | **Partial** — database file is git-ignored |
| **PL** Planning | Management | — | — | **Partial** — architecture docs exist; no security plan |
| PE · PS · PM · AT · MA | various | — | — | Out of scope (section 4) |

**Count of risks:** 6 High, 12 Medium, 4 Low (22 in total). Three of the Low risks (T12, T13, T14) are already mitigated by controls in the code, listed in section 5.

---

## 3. The risk register, by family

Each table gives the risk, its rating, the ITSG-33 controls that address it, what the code does today (with the line that shows it), and what to do.

### 3.1 AC — Access Control

| ID | Risk | Rating | Controls | What the code does today | What to do |
|---|---|---|---|---|---|
| **T1** | The API identifies the caller only by the `username` in the request, so anyone can act as any borrower (insecure direct object reference). | **High** | AC-3 Access Enforcement · AC-14 Permitted Actions Without Identification or Authentication · AC-6 Least Privilege | Writes take the borrower from the body ([api.mjs:123](../server/api.mjs#L123), [:165](../server/api.mjs#L165)); reads take it from the query string ([:209](../server/api.mjs#L209), [:230](../server/api.mjs#L230)). There is no session, token or role check anywhere in the file. | Issue a session or signed token at login. Take the borrower **from it**, never from the request. Enforce it on every read and write. |
| **T7** | Read endpoints return any borrower's personal data and ledger to any caller who supplies a username. | **High** | AC-3 · AC-14 · AC-6 | `GET /api/payments/history`, `/api/profile/history`, `/api/chat-history` answer without a login ([api.mjs:209-233](../server/api.mjs#L209-L233)). | Same fix as T1: authorise each read against the authenticated borrower. |
| **R19** *(new)* | Username enumeration: an unknown username returns **404**, a real one **200**, so an attacker can confirm which accounts exist. | Medium | AC-3 · IA-6 Authenticator Feedback · SI-11 Error Handling | "Borrower not found" with status 404 at [api.mjs:124](../server/api.mjs#L124), [:166](../server/api.mjs#L166) and [:211](../server/api.mjs#L211). (Login itself is uniform: "Invalid username or password.") | Answer unknown and unauthorised identically. This falls out of the T1 fix. |
| **R20** *(new)* | The Azure route is an **open relay**: anyone who can reach the dev server can send prompts through `/api/azure-ai`, and the proxy adds the key for them. Applies only when Azure mode is configured. | Medium | AC-3 · SC-7 Boundary Protection · SC-5 Denial of Service Protection | The proxy forwards `/api/azure-ai` with no authentication and sets the `api-key` header itself ([proxy.conf.js:32-39](../proxy.conf.js#L32-L39)). | Require authentication on that route, add rate limits and a spend budget with alerts, and keep it off unless needed. |
| **R21** *(new, found by testing)* | **Any web page can use the API from a visitor's browser.** The dev server adds `Access-Control-Allow-Origin: *` to proxied API responses and answers CORS preflights; the API reads a request body as JSON whatever its `Content-Type`, never checks `Origin`, and has no CSRF defence. A hostile page can therefore **read** every borrower's data, and **write** with a "simple" `text/plain` POST that needs no preflight. | **High** | AC-3 Access Enforcement · SC-7 Boundary Protection · SC-23 Session Authenticity · CM-7 Least Functionality | Verified against the running system: the wildcard header appears on responses via port 4200 but not from the API directly on port 3000; a `text/plain` POST to `/api/language-model/classify` with a foreign `Origin` returned 200. `readJson` parses the body without looking at the content type ([api.mjs:302-306](../server/api.mjs#L302-L306)); nothing in the file checks `Origin` or `Host`. | Authenticate (T1) with a `SameSite=Strict` cookie and a CSRF token on every write; accept `application/json` only and check `Origin` in the API; remove the wildcard CORS (dev-server setting and any production proxy); give the dev server a private host name. |

### 3.2 IA — Identification and Authentication

| ID | Risk | Rating | Controls | What the code does today | What to do |
|---|---|---|---|---|---|
| **T2** | No rate limit or lockout on login, and every demo account shares one password, so brute force and credential stuffing succeed. | **High** | AC-7 Unsuccessful Logon Attempts · IA-5 Authenticator Management · IA-8 Identification and Authentication (Non-Organizational Users) | `login()` compares and answers, with no counter or delay ([api.mjs:97](../server/api.mjs#L97)); all six accounts use `demo123` ([build.mjs:12](../db/build.mjs#L12), [README.md:445](../README.md#L445)). | Rate-limit per IP and per account, lock out after repeated failures, add multi-factor authentication for real borrowers, and retire shared passwords. |
| **T6** | Passwords are stored in **plain text**, and the demo passwords are in the seed file and README. A database or repository leak exposes every credential. | **High** | IA-5 Authenticator Management (password storage enhancement) · SC-28 Protection of Information at Rest | `password TEXT NOT NULL` with the comment "plaintext, as the app compares it directly" ([schema.sql:106](../db/schema.sql#L106)). The API never returns the password in the borrower record (the `toUser` mapper in [api.mjs](../server/api.mjs)). | Store salted hashes (argon2 or bcrypt); compare with a constant-time function; remove credentials from the seed file and README; rotate the demo passwords. |

### 3.3 AU — Audit and Accountability

| ID | Risk | Rating | Controls | What the code does today | What to do |
|---|---|---|---|---|---|
| **T5** | History rows record a reference and a time but **not who** made the request, from where, or under what authentication, and the API keeps no request log. An actor can deny an action, and none of AP1–AP4 would be noticed. | Medium | AU-2 Auditable Events · AU-3 Content of Audit Records · AU-12 Audit Generation · AU-6 Audit Review · AU-9 Protection of Audit Information · AU-10 Non-Repudiation | `payment_history` and `profile_update_history` carry `created_at` and a reference only ([schema.sql:56](../db/schema.sql#L56), [:76](../db/schema.sql#L76)). The server logs one line at startup and prints errors, nothing per request ([api.mjs:322](../server/api.mjs#L322)). | Add an audit log of authenticated actor, source IP, user agent, endpoint and outcome. Write it somewhere the application cannot edit. Alert on bursts, repeated failed logins and unusual reads. |

### 3.4 SC — System and Communications Protection

| ID | Risk | Rating | Controls | What the code does today | What to do |
|---|---|---|---|---|---|
| **T8** | Traffic is plain HTTP, so credentials, personal data and balances can be read or altered on the network path. | Medium *(High if exposed)* | SC-8 / SC-9 Transmission Integrity / Confidentiality · SC-13 Use of Cryptography · SC-23 Session Authenticity | The API listens on `127.0.0.1` only ([api.mjs:324](../server/api.mjs#L324)), which contains the risk locally; the dev server serves HTTP and there is no TLS configuration. | Terminate TLS in front of the application, send HSTS, and add `Secure`, `HttpOnly` cookie attributes once sessions exist (T1). |
| **T9** | In `directKey` mode the Azure key is compiled into the bundle and visible in devtools. Proxy mode keeps it on the server. | Medium | SC-12 Cryptographic Key Establishment and Management · IA-5 · CM-7 Least Functionality | Proxy mode: the key is read from an environment variable and added by the proxy ([proxy.conf.js:39](../proxy.conf.js#L39)). `directKey` is still a selectable mode ([ai.config.ts:24](../src/app/configuration/ai.config.ts#L24)). `src/assets/ai-config.js` is git-ignored ([.gitignore:10](../.gitignore#L10)). | Remove `directKey` from anything beyond local experiments; keep the key in a secret store; rotate any key that has been exposed. |
| **T11** | No rate limiting or request timeouts, and SQLite has one writer, so a flood of writes can starve every other borrower. | Medium | SC-5 Denial of Service Protection · SC-7 Boundary Protection | Writes use `BEGIN IMMEDIATE` with a 3-second busy timeout ([api.mjs:121](../server/api.mjs#L121), [:163](../server/api.mjs#L163), [:30](../server/api.mjs#L30)). Request bodies are capped at 16 KB ([api.mjs:305](../server/api.mjs#L305)) and classify text at 2,000 characters ([:242](../server/api.mjs#L242)). | Rate-limit at the edge, set request and header timeouts, cap concurrent connections, and consider a server database if write volume grows. |
| **T10** *(corrected)* | With Azure enabled, **more than the question text leaves the boundary**: the first name and standing tier, **and the loan and payment figures used for narration** — program of study, original and current balance, interest rate, maturity date, amounts due, due dates, payments made and missed. | Medium | SC-7 · AC-4 Information Flow Enforcement · SA-9 External Information System Services · RA-3 | Question text: [azure-ai-language-model.ts:111](../src/app/adapters/driven/azure-ai-language-model.ts#L111). Loan facts: the `facts` object at [:129](../src/app/adapters/driven/azure-ai-language-model.ts#L129). Payment snapshot: [:168](../src/app/adapters/driven/azure-ai-language-model.ts#L168). Name and tier: [:210](../src/app/adapters/driven/azure-ai-language-model.ts#L210). Off by default. | Document exactly what is sent; obtain consent and check the provider's retention and region terms; have narration send rounded or relative figures; or do not enable Azure for real borrowers. See [dependency-and-vendor-review.md](dependency-and-vendor-review.md). |
| **R22** *(new)* | The page loads a stylesheet from **Google Fonts** at run time: every view sends the visitor's IP address and user agent to a third party, makes the UI depend on an outside service, and rules out a strict Content-Security-Policy. | Low | SC-7 · SA-9 External Information System Services · CM-7 Least Functionality | A `<link>` to `fonts.googleapis.com` in [index.html:10](../src/index.html#L10). No other third-party script, font or CDN is loaded by the app. | Self-host the font files (or use system fonts), then set a Content-Security-Policy with `default-src 'self'`. |
| **R16** *(new)* | The SQLite file is **unencrypted** and world-readable on a shared machine, and holds personal data and plain-text credentials. | Medium | SC-28 Protection of Information at Rest · MP-4 Media Storage · AC-3 | `-rw-r--r--` on `db/data/loanservicing.db`; the file is git-ignored ([.gitignore:13](../.gitignore#L13)) so it is not committed. | Restrict file permissions to the service account, encrypt the volume or the database, and keep backups (R17) encrypted. |

### 3.5 SI — System and Information Integrity

| ID | Risk | Rating | Controls | What the code does today | What to do |
|---|---|---|---|---|---|
| **T3** | Payment amounts, balances and schedule changes are **decided in the browser**. The API checks only that the numbers are well-formed and the balance arithmetic adds up, so a modified client can choose any schedule outcome. | **High** | SI-10 Information Input Validation · SI-7 Software and Information Integrity · SA-8 Security Engineering Principles | Decisions live in the Angular core: `processPayment` ([payment.entity.ts:99](../src/app/core/domain/payment.entity.ts#L99)), `applyPayment` ([:154](../src/app/core/domain/payment.entity.ts#L154)), `applyProfileUpdate` ([borrower.entity.ts:111](../src/app/core/domain/borrower.entity.ts#L111)). The API accepts `nextPaymentDate`, `nextPaymentAmount`, `paymentsMade` and `onTimeStreak` after type checks only ([api.mjs:116-117](../server/api.mjs#L116-L117)) and writes them ([:135](../server/api.mjs#L135)). It does reject a stale balance with 409 ([:126](../server/api.mjs#L126)). | Move the decisions to the server; the client sends **intent** (amount, funding source, apply-to) and gets the result back. At minimum, validate every schedule field against the loan's rules. |
| **T15** | Dependencies carry known issues, and a dev server with source maps and an experimental module sit in the running stack. | Medium | SI-2 Flaw Remediation · SA-12 Supply Chain Protection · CM-8 Information System Component Inventory | `npm audit` flags **8 of the 11 runtime packages** (20 distinct advisories, 9 of them XSS or sanitisation bypasses, worst CVSS 9.0) and **71 of all 920 packages** including build tooling (4 critical, 38 high; all build-time). This app uses none of the affected features (no i18n, `innerHTML`, SVG or MathML, `HttpClient` or server rendering), and its two dynamic attribute bindings carry numbers only, so real exposure is likely low. The fix is a **major-version** Angular upgrade. Details: [dependency-and-vendor-review.md](dependency-and-vendor-review.md). `package-lock.json` is committed and an [SBOM](sbom.cdx.json) is generated from it. The API uses `node:sqlite`, which is experimental. | Plan the major Angular upgrade, run `npm audit` in CI, enable Dependabot, pin versions, move to an LTS Node release, and serve a production build. |
| **T12** | A crafted sentence could burn CPU in the keyword router through regex backtracking. | Low · *mitigated* | SI-10 · SC-5 | Input capped at 2,000 characters ([api.mjs:242](../server/api.mjs#L242)); the wildcard is bounded to 3 words ([keyword-router.mjs:25](../server/language-model/keyword-router.mjs#L25)); patterns are fixed, not user-supplied. | Keep the cap; fuzz-test any new keyword before merging. |
| **T13** | SQL injection through any request field. | Low · *mitigated* | SI-10 | All 11 statements in the API use `db.prepare` with bound parameters; none is built from request text. | Keep it that way; lint for string-built SQL. |

### 3.6 CM — Configuration Management

| ID | Risk | Rating | Controls | What the code does today | What to do |
|---|---|---|---|---|---|
| **T9** *(config side)* | Risky modes are selectable at run time: `directKey` for Azure, and a query-string switch (`?ai=`) that changes the model runtime. | Medium | CM-6 Configuration Settings · CM-7 Least Functionality | The mode is read from defaults, a window override and the URL ([ai.config.ts](../src/app/configuration/ai.config.ts)). | Fix the runtime configuration at deploy time; ignore URL overrides outside development. |
| **T15** *(config side)* | The dev configuration is the only one that works end to end: `ng build` produces files with no proxy, so a deployed build needs the data API behind the same `/api` path. | Medium | CM-2 Baseline Configuration · CM-3 Configuration Change Control | `proxy.conf.js` exists for `ng serve` only. | Define and document a production baseline: TLS front end, API behind it, source maps off, secrets from a store. |

### 3.7 SA — System and Services Acquisition

| ID | Risk | Rating | Controls | What the code does today | What to do |
|---|---|---|---|---|---|
| **T4** | Payment reference numbers are generated **in the browser** with `Math.random`, and there is no idempotency key, so a request can be replayed or a reference chosen by the attacker. | Medium | SA-8 Security Engineering Principles · SC-23 · SI-10 | `generateReference()` uses `Math.random` in [payment.entity.ts:193](../src/app/core/domain/payment.entity.ts#L193) and [borrower.entity.ts:154](../src/app/core/domain/borrower.entity.ts#L154). A `UNIQUE` constraint ([schema.sql:50](../db/schema.sql#L50)) and the stale-balance check blunt simple replays. | Generate references on the server with a cryptographic random source, and require an idempotency key on writes. |
| **R18** *(new)* | There is no automated security testing: no authorisation, abuse or fuzz tests, and no pipeline to run any tests on commit. | Medium | SA-11 Developer Security Testing · CA-2 Security Assessments · RA-5 Vulnerability Scanning | One suite exists — 11 tests for the keyword router ([keyword-router.test.mjs](../server/language-model/keyword-router.test.mjs)). No Angular `*.spec.ts` files and no CI configuration are present. | Add API tests for authorisation and tampering (they will fail today — that is the point), run all tests and `npm audit` in CI. |

### 3.8 CP — Contingency Planning and MP — Media Protection

| ID | Risk | Rating | Controls | What the code does today | What to do |
|---|---|---|---|---|---|
| **R17** *(new)* | No backup or recovery. The database is a single file, and `npm run db:build` **drops and recreates every table**, erasing payments and profile updates made through the app. | Medium | CP-9 Information System Backup · CP-10 Recovery and Reconstitution · MP-4 | [schema.sql:4-12](../db/schema.sql#L4-L12) drops all nine tables; there is no backup script or restore procedure in the repository. | Scheduled, encrypted backups; a guard on `db:build` that refuses to run against a database holding real data; a tested restore procedure. |

### 3.9 IR, RA, CA and PL — the supporting families

| Family | Gap | Controls | What to do |
|---|---|---|---|
| **IR** Incident Response | Without a request log (T5) and monitoring there is nothing to detect an incident with, so none of the attack paths could be reported. | IR-4 Incident Handling · IR-5 Incident Monitoring · IR-6 Incident Reporting | Write a short response plan: who is told, how a borrower is notified, how evidence is kept. Build on the AU audit log. |
| **RA** Risk Assessment | This document and the diagrams are a first assessment, but nothing repeats it. | RA-3 Risk Assessment · RA-5 Vulnerability Scanning | Re-run the review when the architecture changes; schedule `npm audit` and dependency scans. |
| **CA** Security Assessment and Authorization | No formal assessment, authorisation decision or continuous monitoring. | CA-2 Security Assessments · CA-6 Security Authorization · CA-7 Continuous Monitoring | Before any real data: select a profile, assess against it, and record a risk acceptance decision. |
| **PL** Planning | Architecture is well documented; there is no security plan. | PL-2 System Security Plan | Turn sections 3 and 6 of this document into the security plan's control implementation statements. |

---

## 4. Families out of scope

| Family | Why it is out of scope here |
|---|---|
| **PE** Physical and Environmental Protection | The system runs on a developer machine; physical controls belong to the hosting organisation. |
| **PS** Personnel Security | About the people who operate the system, not the code. |
| **PM** Program Management | Organisation-wide security programme. |
| **AT** Awareness and Training | About users and operators. (Borrowers should still be warned about phishing once the system is real.) |
| **MA** Maintenance | Hardware and facility maintenance; software patching is covered under SI-2. |

---

## 5. Controls already working

These are worth keeping, and are the reason several threats are rated Low.

| Control (family) | Where in the code |
|---|---|
| **SI-10** Input validation: shape and type checks on every payload; 16 KB body cap; 2,000-character cap on classify text. | [api.mjs:305](../server/api.mjs#L305), [:242](../server/api.mjs#L242), the checks in `recordPayment` and `saveProfile` |
| **SI-10** All SQL is parameterised (11 prepared statements, no string-built SQL). | [api.mjs](../server/api.mjs) |
| **SI-11** Error handling: unexpected errors return a generic message; no stack traces leave the server. | [api.mjs:322](../server/api.mjs#L322) |
| **SC-7** Boundary protection: the API listens on loopback only; the browser reaches it through the proxy. | [api.mjs:324](../server/api.mjs#L324), [proxy.conf.js:51](../proxy.conf.js#L51) |
| **SC-12 / IA-5** The Azure key is held in an environment variable by the proxy and never sent to the browser in proxy mode. | [proxy.conf.js:39](../proxy.conf.js#L39) |
| **IA-5 / IA-6** The password is never returned to the client; login failures use one message for "unknown user" and "wrong password". | `toUser` and `login` in [api.mjs](../server/api.mjs) |
| **SI-7** Integrity of writes: one transaction per write, a stale-balance check (409), a `UNIQUE` reference, and foreign keys on. | [api.mjs:121-135](../server/api.mjs#L121-L135), [schema.sql](../db/schema.sql) |
| **SA-8** Design: the language model can only return a topic name or prose; the Angular core stamps determinism and every figure, so model output cannot reach money or SQL. | `LanguageModelPort` and `InquiryService` |
| **SA-11 (partial)** A regression table and 11 tests guard the keyword router. | [keyword-router.test.mjs](../server/language-model/keyword-router.test.mjs) |
| **MP / CM** Database file, build output and the Azure override file are git-ignored. | [.gitignore:10-16](../.gitignore#L10-L16) |

---

## 6. Priorities

### Before the app is reachable from anywhere but this machine

| Order | Fix | Closes | Controls |
|---|---|---|---|
| 1 | Authenticate every request on the server and take the borrower from the session, with a CSRF defence and strict Origin / Content-Type checks | T1, T7, R19, R21, AP1, AP2, AP3 (against others), AP10 | AC-3, AC-14, IA-8, SC-23, SC-7 |
| 2 | Decide money on the server; server-made references; idempotency keys | T3, T4, AP3 | SI-10, SA-8 |
| 3 | TLS in front of everything | T8, AP6 | SC-8 / SC-9, SC-13 |
| 4 | Hash passwords; remove credentials from the repo; rotate the demo passwords | T6, AP5 | IA-5, SC-28 |
| 5 | Rate limits and lockout on login and writes | T2, T11, AP4, AP8 | AC-7, SC-5 |

Fixes 1 and 2 together close the three paths that need no special skill and end in exposed data or falsified money.

### Next

| Fix | Closes | Controls |
|---|---|---|
| Authenticated audit log, alerts and a short incident plan | T5, detection of AP1–AP4 | AU-2, AU-3, AU-12, IR-4 |
| Protect or remove the Azure route; drop `directKey` | T9, R20, AP9 | AC-3, SC-12, CM-7 |
| Upgrade Angular; `npm audit` and Dependabot in CI; production build | T15, AP7 | SI-2, SA-12, CM-2 |
| Backups and a guard on `db:build` | R17 | CP-9, CP-10 |
| Encrypt the database at rest; tighten file permissions | R16 | SC-28, MP-4 |
| Authorisation and abuse tests; run in CI | R18 | SA-11, CA-2, RA-5 |

### Residual risk and acceptance

For the **POC as it runs today** — one machine, `localhost` only, seeded demo data, no real borrower information — the open High risks (T1, T2, T3, T6, T7, R21) are acceptable **only on these conditions**: the API stays bound to `127.0.0.1`, the dev server is not left running while browsing untrusted sites (R21), the database holds no real personal data, and the demo credentials are not reused anywhere. Break any one of them and the risks above are no longer acceptable.

---

## 7. Traceability: risks to families

| Risk | AC | IA | AU | SC | SI | CM | SA | CP/MP | RA/CA |
|---|---|---|---|---|---|---|---|---|---|
| T1 | ● | | | ● | | | | | |
| T2 | ● | ● | | | | | | | |
| T3 | | | | | ● | | ● | | |
| T4 | | | | ● | ● | | ● | | |
| T5 | | | ● | | | | | | |
| T6 | | ● | | ● | | | | | |
| T7 | ● | | | | | | | | |
| T8 | | | | ● | | | | | |
| T9 | | ● | | ● | | ● | | | |
| T10 | | | | ● | | | | | ● |
| T11 | | | | ● | | | | | |
| T12 | | | | ● | ● | | | | |
| T13 | | | | | ● | | | | |
| T14 | | | | | | | ● | | |
| T15 | | | | | ● | ● | ● | | ● |
| R16 | ● | | | ● | | | | ● | |
| R17 | | | | | | | | ● | |
| R18 | | | | | | | ● | | ● |
| R19 | ● | ● | | | ● | | | | |
| R20 | ● | | | ● | | | | | |
| R21 | ● | | | ● | | ● | | | |
| R22 | | | | ● | | ● | | | |

T14 (prompt injection) is listed for completeness: it is mitigated by design (section 5). T10 is now filed under SC and also needs a privacy decision under RA and PL (document it, get consent, minimise what is sent).

---

## 8. Limits of this document

- It is a **mapping and a first-pass risk register**, not a security assessment, an authorisation decision or evidence of compliance.
- Ratings are the author's judgement and should be reviewed by the system owner and a security assessor.
- The control IDs should be checked against the current Annex 3A and the profile you select before this is used as a formal deliverable.
- Findings reflect the code on the `keyword-search` branch at the time of writing; re-check the line references after any change.
