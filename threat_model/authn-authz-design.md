# Authentication and authorization design

**System:** Hexagonal Student-Loan POC · **Status:** proposed design (nothing here is implemented yet)
**Closes:** T1, T2, T6, T7, R19, R21 · attack paths AP1, AP2, AP3 (against others), AP4, AP5 (partly), AP10
**ITSG-33 controls:** AC-2, AC-3, AC-6, AC-7, AC-11, AC-12, AC-14, IA-5, IA-6, IA-8, SC-23, AU-2

This is the design behind fix **C1** in the [attack paths](attack-paths.png) and REM-01 to REM-04 in the [remediation plan](remediation-plan.md). It is written against the code as it is today, so each change names the file it touches.

---

## 1. Where things stand

| Question | Today | Evidence |
|---|---|---|
| How does a caller prove who they are? | Only at `POST /api/login`, and nothing is remembered afterwards. | [api.mjs:97](../server/api.mjs#L97); the session is a browser variable with no token or cookie ([session.store.ts](../src/app/configuration/session.store.ts)). |
| How does the API know who is calling? | It **does not**. Writes read the borrower from the request body, reads from the query string. | [api.mjs:123](../server/api.mjs#L123), [:165](../server/api.mjs#L165), [:209](../server/api.mjs#L209), [:230](../server/api.mjs#L230) |
| How are passwords stored? | **Plain text.** | [schema.sql:106](../db/schema.sql#L106) |
| Is there throttling or lockout? | No. Forty wrong passwords in a row were all answered, then a correct one succeeded. | observed, see [security-test-plan.md](security-test-plan.md) TC-03 |
| Which roles exist? | None. Every caller is effectively anonymous *and* fully authorised. | whole API |
| Can another website call the API? | Yes (wildcard CORS on the dev server, no Origin check, no CSRF defence). | R21 |

The result: **there is no authentication boundary between the browser and the data.** The design below creates one.

---

## 2. Principles

1. **Identity comes from the server, never from the request.** The borrower is whoever the session says; any `username` in a body or query string is ignored, then removed.
2. **Deny by default.** A route with no declared role is refused.
3. **Authenticate, authorise, validate, act, audit** — in that order, on every request.
4. **Check the object, not just the role.** Being a borrower is not enough; the data must be *yours*.
5. **One answer for "no" and "not yours".** Unknown and unauthorised look identical, so nothing can be enumerated (R19).
6. **Boring and standard.** Server-side sessions, standard password hashing, no home-made crypto.

---

## 3. Actors and roles

| Role | Exists today? | May do | Notes |
|---|---|---|---|
| **Anonymous** | Yes (everyone) | Log in. Nothing else. | Today it can do everything. |
| **Borrower** | Implied | Read and change **only their own** records. | The only role the current app serves. |
| **Support agent** | No — *future* | Read a borrower's record **with a recorded reason**; never change money. | Needed only if staff will use the system. Break-glass access, always audited. |
| **Operator** | No — *future* | Run and maintain the service; **no routine access to borrower data**. | Separation of duties: the person who can deploy cannot read ledgers. |
| **Service** | Implied | The API calling Azure or the database. | Uses its own credentials from a secret store, never a borrower's. |

---

## 4. Authentication design

### 4.1 Password storage (T6)

| Item | Design |
|---|---|
| Algorithm | **scrypt** from Node's built-in `node:crypto` (no new dependency) with `N=2^17, r=8, p=1`, a 16-byte random salt per password; **or** argon2id (`m=19 MiB, t=2, p=1`) if a dependency is acceptable. Pick one and record it in an ADR. |
| Stored as | One string: `algorithm$parameters$salt$hash`, so parameters can be raised later and old hashes upgraded at next login. |
| Compare | `crypto.timingSafeEqual`. |
| Unknown username | Still compute a hash against a dummy value, so response time does not reveal whether the account exists. |
| Seed data | The demo passwords are hashed when `db:build` runs; **no password appears in the repository or the README**. Demo credentials are generated per environment and printed once. |
| Migration | Add a `password_hash` column, populate it, switch the login check, then drop the plain-text column. |

### 4.2 Password policy

Length over complexity: a minimum of 12 characters, no composition rules, allow long passphrases, reject known-breached and obvious passwords (a bundled list is enough for the POC), and never expire passwords on a schedule — require a change only on suspected compromise.

### 4.3 Throttling and lockout (T2)

| Control | Design |
|---|---|
| Per account | After **5** consecutive failures, refuse further attempts for **15 minutes**, doubling for each further round. The delay is temporary, so an attacker cannot lock a victim out permanently. |
| Per source | At most **20** login attempts per minute per IP address, regardless of account. |
| Response | Always the same message and status for failure, lockout and unknown user. A `Retry-After` header is added once a limit applies. |
| Notify | Tell the borrower (to their contact address) after a lockout or a login from a new device. |
| Log | Every failure and lockout is an audit event ([logging-incident-recovery.md](logging-incident-recovery.md)). |

### 4.4 Multi-factor authentication

Not required for the demo, **required for any real deployment** under a Protected B profile. Time-based one-time passwords (TOTP) with ten single-use recovery codes. Until MFA exists, *step-up* (section 6) is the compensating control.

### 4.5 Session management (SC-23, AC-11, AC-12)

| Item | Design |
|---|---|
| Type | **Server-side session**, not a self-contained token. Easy to revoke and to expire; no secrets in the browser. |
| Identifier | 256 bits from `crypto.randomBytes`; only a **hash** is stored in a new `session` table. |
| Cookie | `__Host-sid`; `HttpOnly`; `Secure`; `SameSite=Strict`; `Path=/`; no `Domain`. (On plain-HTTP `localhost` in development, `Secure` and the `__Host-` prefix are relaxed; production must use HTTPS — T8.) |
| Lifetime | **Idle timeout 15 minutes**, **absolute 8 hours**. |
| Rotation | A new identifier at login and again after any step-up or password change. |
| Logout | `POST /api/logout` deletes the server-side session and clears the cookie. |
| Revocation | Changing the password or contact details ends all other sessions. |
| Concurrency | Decision needed: allow several devices (propose 3) or one. |

### 4.5a Cross-site request defence (R21, AP10)

Three layers, because each alone has gaps:

1. **`SameSite=Strict` cookie** — the browser does not attach the session to requests started by another site.
2. **CSRF token** — returned by `GET /api/me`, required in an `X-CSRF-Token` header on every write, compared in constant time.
3. **Strict request checks** in the API — accept `application/json` only (reply `415` otherwise); require `Origin` (or `Referer`) to match the app's own origin on every write; **remove the wildcard CORS** that the dev server adds, and add no CORS headers in production.

### 4.6 Account recovery

Single-use reset token of at least 128 bits, stored hashed, valid for 15 minutes, delivered to the contact address on file. The request form always answers "if the account exists, we have sent instructions." A successful reset ends every session. A change of contact details triggers a notice to the **old** address as well, which is what blunts AP2.

---

## 5. Authorization design

### 5.1 Mechanism

```
request ─► resolve session ─► route requires which role? ─► object check ─► validate ─► act ─► audit
              │ none: 401          │ not allowed: 404/403        │ not yours: 404
```

- **One place** resolves the session and builds a context `{ borrowerId, roles, sessionId }`. Handlers receive it; they never read an identity from the request.
- **Every query is scoped:** `… WHERE borrower_id = ctx.borrowerId`. There is no code path that takes a borrower id from input.
- **Routes declare their role** in the route table; a route without one is refused.
- A foreign or unknown object returns the same `404` as a missing one.

### 5.2 Endpoint and role matrix

`self` = only the caller's own records. A blank cell = refused. Support and operator columns are **future roles**.

| Endpoint | Anonymous | Borrower | Support agent | Operator | Checks | Today |
|---|---|---|---|---|---|---|
| `POST /api/login` | ✔ | ✔ | ✔ | ✔ | Throttle (4.3), uniform failure | Open; no throttle |
| `POST /api/logout` | | ✔ | ✔ | ✔ | Valid session, CSRF | *Does not exist* |
| `GET /api/me` | | ✔ self | | | Valid session | *Does not exist* — login returns the record |
| `POST /api/payments` | | ✔ self | | | Session, CSRF, **server-side decision** (REM-05), idempotency key | Borrower named in the body |
| `GET /api/payments/history` | | ✔ self | ✔ read-only, reason logged | | Session; scoped query | Any caller, username in query |
| `POST /api/profile` | | ✔ self, **step-up** | | | Session, CSRF, re-authentication, notice to old address | Borrower named in the body |
| `GET /api/profile/history` | | ✔ self | ✔ read-only, reason logged | | Session; scoped query | Any caller, username in query |
| `GET /api/chat-history` | | ✔ self | ✔ read-only, reason logged | | Session; scoped query | Any caller, username in query |
| `GET /api/jobs` | | ✔ | ✔ | | Session | Any caller |
| `POST /api/language-model/*` | | ✔ | | | Session, CSRF, size caps; **no borrower identifiers in the body** | Any caller |
| `/api/azure-ai/*` (proxy) | | | | | **Not exposed to browsers**; the API calls Azure with a server-held credential, rate-limited and budgeted (R20) | Open relay, key added by the proxy |

### 5.3 Step-up authentication

Ask for the password again (or an MFA code once it exists) before:

- changing email, phone or mailing address (AP2);
- recording a payment above a threshold the owner sets (AP3);
- changing the password.

---

## 6. What changes in the code

### 6.1 Server ([server/api.mjs](../server/api.mjs))

| Change | Detail |
|---|---|
| Session and request context | A small module that reads the cookie, looks up the hashed id in a new `session` table, applies the idle and absolute timeouts, and attaches `ctx`. |
| Route table | Replace the flat `routes` map with entries `{ roles, csrf, handler }`; refuse anything undeclared. |
| Remove identity from input | Delete `username` from the `POST /api/payments` and `POST /api/profile` bodies and from both history query strings; use `ctx.borrowerId` ([lines 123, 165, 209, 230](../server/api.mjs#L123)). |
| Uniform errors | Replace the three "Borrower not found" 404s with one response for unknown and unauthorised ([lines 124, 166, 211](../server/api.mjs#L124)). |
| Request checks | `415` unless `application/json`; check `Origin`; add security headers (`Strict-Transport-Security`, `X-Content-Type-Options`, `Content-Security-Policy`, `Referrer-Policy`) — see REM-19. |
| New endpoints | `POST /api/logout`, `GET /api/me`, and the password-reset pair. |
| Login | Hashed comparison with a dummy hash for unknown users, per-account and per-IP throttling, new session on success. |

### 6.2 Database ([db/schema.sql](../db/schema.sql))

New tables: `session` (hashed id, borrower id, created, last seen, expires, IP, user agent), `login_attempt` (or an in-memory limiter for the POC), `password_reset`, and an `audit_log` ([logging-incident-recovery.md](logging-incident-recovery.md)). Replace `user_authentication.password` with `password_hash`.

### 6.3 Angular app

| Change | Where |
|---|---|
| Stop sending a username | `ApiPaymentRepository.history(username)`, `ApiProfileRepository.history(username)`, `ApiChatHistory.getHistory(user)` and the two write calls: drop the identifier and send `credentials: 'same-origin'`. |
| CSRF header | A small helper adds `X-CSRF-Token` to every write. |
| Session handling | The session store keeps profile data only; the route guard asks `GET /api/me`; a `401` returns the user to the login page; logout calls the API. |
| Ports | **No change to the core or the ports.** Authentication is an adapter concern; `UserRepositoryPort.findByCredentials` already returns a user or `null`. |

This is the hexagonal payoff: the whole change lives in the adapters and the server.

---

## 7. Order of work

1. **Hash passwords** (4.1) — safe on its own, and everything else builds on it.
2. **Server-side sessions and the request context** (4.5, 5.1).
3. **Scope every query to the session; remove identity from requests** (5.1, 6.1, 6.3).
4. **CSRF and request checks; remove wildcard CORS** (4.5a).
5. **Throttling and lockout** (4.3).
6. **Step-up, notices and reset** (5.3, 4.6).
7. **MFA** before real borrowers are enrolled (4.4).

Each step has a test in [security-test-plan.md](security-test-plan.md); steps 1 to 4 must be done before the app is reachable beyond `localhost`.

---

## 8. Controls satisfied

| ITSG-33 control | How |
|---|---|
| **IA-8** Identification and Authentication (Non-Organizational Users) | Borrowers authenticate with a hashed password and, in production, a second factor. |
| **IA-5** Authenticator Management | Hashed storage, length-based policy, breached-password check, no shared defaults. |
| **IA-6** Authenticator Feedback | One failure message for every case. |
| **AC-7** Unsuccessful Logon Attempts | Per-account cool-down and per-IP limit. |
| **AC-3 / AC-6** Access Enforcement / Least Privilege | Scoped queries; role per route; support is read-only and reasoned; operators have no routine data access. |
| **AC-14** Permitted Actions Without Identification | Only `login` and password-reset requests are open. |
| **AC-11 / AC-12** Session Lock / Termination | Idle and absolute timeouts; explicit logout. |
| **SC-23** Session Authenticity | Unguessable server-side id, `SameSite=Strict`, CSRF token, Origin checks. |
| **AU-2** Auditable Events | Logins, failures, lockouts, step-ups and denials are logged. |

---

## 9. Decisions needed

| # | Decision | Suggested default |
|---|---|---|
| 1 | scrypt (no dependency) or argon2id (one dependency) | scrypt for the POC |
| 2 | Sessions per borrower | 3 |
| 3 | Is MFA mandatory at launch? | Yes for real borrowers |
| 4 | Payment step-up threshold | The owner sets it from the business risk |
| 5 | Will support staff use the system? | Decide before designing the support role further |
| 6 | Where do reset and notification emails come from? | Needs a mail service; out of scope for the POC |
