# Attack-path test cases

**System:** Hexagonal Student-Loan POC · **Source:** the ten paths in [attack-paths.png](../attack-paths.png) · **Status of every case:** Not run

Each case plays one attack path **from the first step to the impact**, the way an attacker would, so it tests that the controls work together. The OWASP cases in [owasp-top10-test-cases.md](owasp-top10-test-cases.md) test one weakness at a time. Setup and the safe way to run data-changing cases are in [README.md](README.md). Cases are numbered **AT-nn**.

A path **passes** when the attacker is stopped **at or before the step named in "Must be stopped at"**, and the attempt is **noticed** (see AT-12).

| ID | Path | Attacker | Impact if it works | Choke point that closes it |
|---|---|---|---|---|
| **AT-01** | AP1 Read anyone's data | Anonymous network user | Every borrower's ledger, contact details and chat exposed | C1 server-side authentication |
| **AT-02** | AP2 Hijack contact details | Anonymous network user | Email, phone and address replaced; no actor recorded | C1, plus re-authentication (REM-21) |
| **AT-03** | AP3 Forge payments and schedule | Malicious borrower or anyone with a username | Falsified money and payment schedule in the ledger | C1 and C2 server-side decisions |
| **AT-04** | AP4 Take over an account | Anonymous network user | Logged in as a borrower | Lockout and throttling (REM-06) |
| **AT-05** | AP5 Steal credentials from a leak | Outsider holding the repo, database file or a backup | Every password in plain text | Password hashing; secrets out of the repo |
| **AT-06** | AP6 Intercept traffic | Network attacker | Credentials and personal data in clear | TLS (C3) |
| **AT-07** | AP7 Poison a dependency | Supply-chain attacker | Hostile code in the build or at run time | Lockfile, audit, install policy |
| **AT-08** | AP8 Flood the API | Anonymous network user | Service unavailable | Rate limits |
| **AT-09** | AP9 Use the Azure relay | Anyone who can reach the dev server | Quota spent, data sent to Azure | Authentication on the relay |
| **AT-10** | AP10 Attack from any web page | Attacker website opened in the same browser | Actions taken as the visitor | C10 cross-site defence |
| **AT-11** | AP1 + AP2 + AP4 chained | Anonymous network user | Full account takeover from nothing | C1 breaks the chain at step 1 |
| **AT-12** | All paths | Any | The attacks go unnoticed | Audit log and detections |

The "choke point" names (C1, C2, C3, C10) are those in the [attack-path diagram](../attack-paths.png) and the [risk register](../itsg-33-risk-register.md).

---

## Scenarios

### AT-01 · AP1 Read anyone's data

| | |
|---|---|
| **Steps** | 1. With no login, call `GET /api/payments/history?username=<name>` for a list of likely names (the seeded names, then first names, then `user1`, `user2`…). 2. For each name that answers `200`, also call `/api/profile/history` and `/api/chat-history`. 3. Count the borrowers and records collected and the time taken. |
| **Must be stopped at** | Step 1: no data without a session |
| **Expected secure result** | `401` for every request, identical for known and unknown names. Zero records collected |
| **Maps to** | T1, T7, R19 · A01, A07 · TC-01, TC-04 · OT-01, OT-23 |
| **Writes?** | No |
| **Today (predicted)** | Fail: all known borrowers' data returned. Known names answer `200`, unknown `404`, so enumeration works |

### AT-02 · AP2 Hijack contact details

| | |
|---|---|
| **Steps** | 1. With no login, `POST /api/profile` for a known borrower with the attacker's email, phone and address. 2. Read the profile back. 3. Read the profile update history. 4. Look for any record of who made the change. |
| **Must be stopped at** | Step 1 |
| **Expected secure result** | Refused. If a legitimate change is made, it needs re-authentication, a notice goes to the old address, and the history names the actor |
| **Maps to** | T1, T5 · A01, A09 · TC-02, TC-29 · OT-02 |
| **Writes?** | Yes (disposable instance) |
| **Today (predicted)** | Fail: `201`, the email changes, and the history holds a reference and a time but no actor |

### AT-03 · AP3 Forge payments and schedule

| | |
|---|---|
| **Steps** | 1. Read the borrower's balance (AP1, step 1). 2. Build a payment whose `updated` block is consistent with that balance but sets `nextPaymentAmount` to `0`, `paymentsMade` to a high number and `onTimeStreak` to a high number. 3. Send it. 4. Read the ledger, the loan and the schedule. 5. Run the reconciliation check (last `balance_after` equals the loan balance). |
| **Must be stopped at** | Step 3 for an anonymous caller; at step 3 for the schedule fields even for a logged-in borrower |
| **Expected secure result** | The server computes balance and schedule. Forged fields are ignored or rejected. Reconciliation holds |
| **Maps to** | T3, T4 · A04, A08 · TC-10, TC-11, TC-26 · OT-13, OT-14, OT-26 |
| **Writes?** | Yes (disposable instance) |
| **Today (predicted)** | Fail: accepted. The ledger still reconciles, so the forgery is visible only in the schedule fields |

### AT-04 · AP4 Take over an account

| | |
|---|---|
| **Steps** | 1. Take the usernames found in AT-01. 2. Try the seeded demo password, then 50 common passwords, against each name. 3. Record attempts per second and the first success. 4. After a success, check what the session gives access to. |
| **Must be stopped at** | Step 2: throttling or lockout after a small number of failures |
| **Expected secure result** | Lockout or growing delay after about 5 failures. The borrower is told. No success from a guessed password |
| **Maps to** | T2, T6 · A07 · TC-03, TC-31 · OT-18, OT-23 |
| **Writes?** | No |
| **Today (predicted)** | Fail: no throttle, and demo accounts use a known password, so the first attempt succeeds |

### AT-05 · AP5 Steal credentials from a leak

| | |
|---|---|
| **Steps** | 1. From a copy of the repository, search for passwords (`grep -ri demo123`, the seed script). 2. Run `git log -p` and look for a committed database. 3. Open a copy of the database file and read `user_authentication`. 4. Check the permissions and encryption of the file and of any backup. |
| **Must be stopped at** | Step 3: even with the file, passwords are not usable |
| **Expected secure result** | Only salted slow hashes (for example Argon2id or bcrypt) in the table. No credentials or database in git. Database and backups encrypted with owner-only access |
| **Maps to** | T6, R16 · A02, A08 · TC-05, TC-23 · OT-28 |
| **Writes?** | No |
| **Today (predicted)** | Fail: plain-text passwords in the table and in the seed script. The file is unencrypted |

### AT-06 · AP6 Intercept traffic

| | |
|---|---|
| **Steps** | 1. Expose the dev server beyond localhost (`ng serve --host 0.0.0.0`) in a test network. 2. From a second machine on the same network, capture traffic (Wireshark or `mitmproxy`) while a borrower logs in and pays. 3. Search the capture for the password and personal data. 4. Try to alter a response in transit. |
| **Must be stopped at** | Step 3: nothing readable on the wire |
| **Expected secure result** | HTTPS only, HSTS, no readable credentials or personal data. A modified response is rejected |
| **Maps to** | T8 · A02 · TC-07 · OT-06, OT-19 |
| **Writes?** | No |
| **Today (predicted)** | Fail: plain HTTP, so the password and data are readable |

### AT-07 · AP7 Poison a dependency

| | |
|---|---|
| **Steps** | 1. In a **scratch copy** of the repository, add a local package whose `postinstall` script writes a marker file. 2. Install with the project's normal command. 3. Check whether the marker was written. 4. Edit a lockfile hash and run `npm ci`. 5. Check whether CI or review would have flagged the new dependency. |
| **Must be stopped at** | Step 2 or 4: the install policy or lockfile check blocks it |
| **Expected secure result** | Install scripts are disabled or reviewed, the lockfile is enforced, and a new dependency needs review |
| **Maps to** | T15 · A06, A08 · TC-21 · OT-21, OT-27 |
| **Writes?** | Scratch copy only |
| **Today (predicted)** | Fail: no install-script policy and no dependency review gate are in place |

### AT-08 · AP8 Flood the API

| | |
|---|---|
| **Steps** | 1. Send 200 requests per second to a cheap route for 60 seconds. 2. Open 500 slow connections that send a byte every few seconds. 3. Send many parallel `classify` calls at the 2,000-character limit. 4. Send many parallel writes. 5. Measure the 95th-percentile latency of a normal request throughout, and note any `500`. |
| **Must be stopped at** | Step 1: excess is shed with `429` while normal requests stay fast |
| **Expected secure result** | `429` for the excess, no `500`, normal users unaffected. Connection and request timeouts end slow clients |
| **Maps to** | T11, T12 · A04 · TC-14, TC-15, TC-16 · OT-12 |
| **Writes?** | Step 4 only (disposable instance) |
| **Today (predicted)** | Fail: no rate limit. Heavy write contention may also return `500` once the 3-second busy timeout is exceeded |

### AT-09 · AP9 Use the Azure relay

| | |
|---|---|
| **Steps** | 1. In Azure mode with a dummy endpoint, call `/api/azure-ai/...` with no credentials. 2. Send a large prompt repeatedly. 3. Send a prompt that tries to override instructions. 4. Check what personal data leaves in the payload. |
| **Must be stopped at** | Step 1 |
| **Expected secure result** | `401` without a session. A per-user quota. Only minimised data is sent, with consent |
| **Maps to** | R20, T9, T10, T14 · A10, A01 · TC-18, TC-19, TC-20, TC-30 · OT-31 |
| **Writes?** | No |
| **Today (predicted)** | Fail: the relay forwards unauthenticated calls |

### AT-10 · AP10 Attack from any web page

| | |
|---|---|
| **Steps** | 1. Serve a test page from a different origin (`python -m http.server 9000`). 2. In it, send `fetch('http://localhost:4200/api/profile', {method:'POST', mode:'no-cors', headers:{'Content-Type':'text/plain'}, body:'<profile JSON>'})` and a hidden HTML form post. 3. Open the page in the same browser as a logged-in borrower. 4. Check whether the profile changed. 5. Repeat with the request's `Host` header set to an unrelated name (a DNS-rebinding check). |
| **Must be stopped at** | Step 2: a cross-site write is refused |
| **Expected secure result** | `403` or `415`. The profile is unchanged. An unknown `Host` is refused |
| **Maps to** | R21 · A01, A05 · TC-09, TC-28 · OT-20 |
| **Writes?** | Yes (disposable instance) |
| **Today (predicted)** | Fail: a `text/plain` body is parsed as JSON, so the write succeeds. No `Host` check exists |

### AT-11 · Chain: enumerate, hijack, take over

| | |
|---|---|
| **Steps** | 1. Enumerate usernames (AT-01). 2. Replace a borrower's contact details (AT-02). 3. Use the new contact point to start a password reset, if one exists. 4. Log in with the demo password or a reset (AT-04). 5. Make a payment as the borrower (AT-03). |
| **Must be stopped at** | Step 1, and again at step 2 and step 4 (defence in depth) |
| **Expected secure result** | No step succeeds without authentication. A change of contact details blocks reset for a cooling-off period and alerts the old address |
| **Maps to** | AP1, AP2, AP4, AP3 · T1, T2 · A01, A07 |
| **Writes?** | Yes (disposable instance) |
| **Today (predicted)** | Fail at every step. There is no reset flow, so step 3 is **not applicable** today and becomes a required test if one is added |

### AT-12 · Detection: are the attacks noticed

| | |
|---|---|
| **Steps** | 1. Run AT-01, AT-02, AT-04 and AT-10 in turn. 2. After each, look for the log records and any alert, using the detections defined in [logging-incident-recovery.md](../logging-incident-recovery.md). 3. Record the delay between the attack and the alert. |
| **Must be stopped at** | Not prevented: this case tests detection |
| **Expected secure result** | Each attack produces a record naming actor, source, endpoint and outcome, and raises the matching alert within the target time |
| **Maps to** | T5 · A09 · TC-13 · OT-29 |
| **Writes?** | Yes (disposable instance) |
| **Today (predicted)** | Fail: nothing is logged per request and no alert exists. Mark as **Future** until logging is built |
