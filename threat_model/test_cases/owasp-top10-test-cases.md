# OWASP Top 10 test cases

**System:** Hexagonal Student-Loan POC · **Standard:** OWASP Top 10 (2021) · **Status of every case:** Not run

Setup, request templates and the safe way to run data-changing cases are in [README.md](README.md). Cases are numbered **OT-nn**. "Today" is what the code on branch `keyword-search` is expected to do, from reading [server/api.mjs](../../server/api.mjs); it is a prediction until the case is run.

| Category | Cases |
|---|---|
| [A01 Broken access control](#a01-broken-access-control) | OT-01 to OT-05 |
| [A02 Cryptographic failures](#a02-cryptographic-failures) | OT-06 to OT-08 |
| [A03 Injection](#a03-injection) | OT-09 to OT-12 |
| [A04 Insecure design](#a04-insecure-design) | OT-13 to OT-16 |
| [A05 Security misconfiguration](#a05-security-misconfiguration) | OT-17 to OT-20 |
| [A06 Vulnerable and outdated components](#a06-vulnerable-and-outdated-components) | OT-21 to OT-22 |
| [A07 Identification and authentication failures](#a07-identification-and-authentication-failures) | OT-23 to OT-25 |
| [A08 Software and data integrity failures](#a08-software-and-data-integrity-failures) | OT-26 to OT-28 |
| [A09 Security logging and monitoring failures](#a09-security-logging-and-monitoring-failures) | OT-29 to OT-30 |
| [A10 Server-side request forgery](#a10-server-side-request-forgery) | OT-31 to OT-32 |

---

## A01 Broken access control

| ID | Test | How | Expected secure result | Maps to | Type | Writes? | Today (predicted) |
|---|---|---|---|---|---|---|---|
| **OT-01** | Read another borrower's data by varying the username | `GET $API/api/payments/history?username=` with `alice`, `ALICE`, ` alice` (leading space), `alice%20`, `alice%00`; repeat on `/api/profile/history` and `/api/chat-history` | Only the logged-in borrower's own data. Anything else is `401` or `403` | A01 · T1, T7 · AP1 · TC-01 | A | No | Fail: the server trims the name and returns the data for any caller. Case variants probably `404` |
| **OT-02** | Write to another borrower's profile using the body `username` | `POST /api/profile` with `username` set to a borrower you are not logged in as | Refused. The borrower comes from the session, not the body | A01 · T1 · AP2 · TC-02 | A | Yes | Fail: written (`201`) |
| **OT-03** | Mass assignment: add fields the client must not control | In the profile body add `updated.creditScore`, `updated.userType`, `updated.borrowerId`, `updated.username`; in the payment body add `updated.interestRate`, `updated.maturityDate`. Then read the borrower back | Unknown fields are rejected or ignored. Credit score, type, rate and maturity are unchanged | A01 · T3 · AP2, AP3 | A | Yes | Expected pass: the server reads only named fields. Confirm the stored row is unchanged |
| **OT-04** | Wrong HTTP method on every route | `PUT`, `DELETE`, `PATCH`, `HEAD`, `OPTIONS` on `/api/payments`, `/api/profile`, `/api/login`; `GET` on the POST-only routes; `POST` on the GET-only routes | `404` or `405` with no data and no change | A01 · A05 | A | No | Expected pass: routes are keyed by method and path, so others give `404` |
| **OT-05** | Request files the dev server should not serve | `GET /db/data/loanservicing.db`, `/server/api.mjs`, `/.git/config`, `/package.json`, `/..%2f..%2fdb%2fdata%2floanservicing.db`, `/%2e%2e/%2e%2e/etc/passwd` | `404` for all. Only the built app is served | A01 · A05 · R16 · AP5 | A | No | Check: depends on the dev server's static-file rules. Must pass for any deployment |

## A02 Cryptographic failures

| ID | Test | How | Expected secure result | Maps to | Type | Writes? | Today (predicted) |
|---|---|---|---|---|---|---|---|
| **OT-06** | TLS configuration | Run `testssl.sh` or `nmap --script ssl-enum-ciphers` against the HTTPS edge; request over HTTP | TLS 1.2 or later only, no weak ciphers, HTTP redirects, HSTS present | A02 · T8 · AP6 · TC-07 | S | No | Future: no TLS exists yet |
| **OT-07** | Sensitive data in URLs | List every request URL in browser devtools after login, and read any proxy or server logs | No username, email or other personal data in the query string | A02 · PT (privacy) | M | No | Fail: the username travels in the query of every history and chat call |
| **OT-08** | Sensitive data kept in the browser | After login, read `localStorage`, `sessionStorage`, IndexedDB and cookies in devtools | No password, token that can be replayed forever, or full profile cached longer than the session | A02 · A07 · T6 | M | No | Check: record what the app keeps in storage |

## A03 Injection

| ID | Test | How | Expected secure result | Maps to | Type | Writes? | Today (predicted) |
|---|---|---|---|---|---|---|---|
| **OT-09** | SQL injection in every text input | Send `'; DROP TABLE payment;--`, `' OR '1'='1`, `%` and `_` in `referenceNumber`, `fundingSource`, profile `email`, `phone`, `mailingAddress`, `/api/jobs?program=` and the username parameters. Then list the tables and compare the row counts | Payloads are stored or rejected as plain text. No table changes, no error text | A03 · T13 · TC-17 | A | Yes | Expected pass: all statements are prepared. Confirm the stored value comes back verbatim |
| **OT-10** | Stored cross-site scripting | Set the mailing address to `<img src=x onerror=alert(1)>` and `"><script>alert(1)</script>`. Open the profile card, the update-history card and the chat | Shown as text. No script runs | A03 · R22 | M | Yes | Expected pass: Angular escapes by default and no `innerHTML` use was found in `src`. Re-check after any template change |
| **OT-11** | Malformed JSON and prototype pollution | Send `{"__proto__":{"admin":true}}`, `{"constructor":{"prototype":{}}}`, 10,000-level nested arrays, duplicate keys, arrays or objects where strings are expected, `null`, `[]`, a bare string | `400` with a plain message. Never `500`, never a changed behaviour for other requests | A03 · A04 · T11 | A | No | Check: the 16 KB body cap helps. Confirm no `500` and no leak into later requests |
| **OT-12** | Keyword router abuse | `POST /api/language-model/classify` with 2,000 characters of `* * *`, `a|b|c|...` alternation, 3-word wildcard patterns, mixed Unicode and emoji, and `candidates` as a huge array, a string or `null` | Answers quickly (under 100 ms) with `200` or `400`. No hang, no `500` | A03 · T12 · TC-16 | A | No | Expected pass for length (capped at 2,000). Check `candidates` handling |

## A04 Insecure design

| ID | Test | How | Expected secure result | Maps to | Type | Writes? | Today (predicted) |
|---|---|---|---|---|---|---|---|
| **OT-13** | Unusual payment amounts | Send `amount` of `0`, `-5`, `0.001`, `10.005`, `1e308`, `"10"` (string), `true`, and more than the balance, each with a consistent `updated` | Anything not a positive whole-cent amount within the balance is `400`. Ledger and balance unchanged | A04 · T3 · AP3 | A | Yes | Expected: `0`, negative, string and over-balance refused. Check `0.001` and `10.005` (the server rounds the result, not the amount) |
| **OT-14** | Race: many identical payments at once | Fire 20 copies of one payment in parallel with the same `expectedBalance` and different references | Exactly one `201`; the rest `409`. Balance reduced once | A04 · T4 · TC-11, TC-12 | A | Yes | Expected pass: the write is serialised with `BEGIN IMMEDIATE` and checks the balance. Confirm no `500` from lock timeouts |
| **OT-15** | Pay a loan already at zero | Pay the full balance, then pay again | The second request is refused. A zero or negative balance never results | A04 · T3 | A | Yes | Expected pass: `amount` must not exceed the balance, and must be above zero |
| **OT-16** | Dates the server should not accept | `effectiveDate` of `1900-01-01`, `2999-12-31`, `2026-13-45`, `0000-00-00`; `nextPaymentDate` far in the past | Impossible or out-of-range dates are `400` | A04 · T3 · AP3 | A | Yes | Likely fail: the server checks only the `YYYY-MM-DD` shape, not that the date is real or sensible |

## A05 Security misconfiguration

| ID | Test | How | Expected secure result | Maps to | Type | Writes? | Today (predicted) |
|---|---|---|---|---|---|---|---|
| **OT-17** | Error messages and headers | Send bad JSON, an unknown route and a request that makes the server fail. Read the status, body and every response header | A generic message. No stack trace, file path, library name or version. No `Server` or `X-Powered-By` detail | A05 · R22 · TC-08 | A | No | Expected pass for bodies (plain messages). Check headers |
| **OT-18** | Seeded demo credentials | Log in to every borrower with the documented demo password and with common ones | No account accepts a default or guessable password | A05 · A07 · T6 · AP4, AP5 | A | No | Fail: demo accounts use `demo123` |
| **OT-19** | Network exposure | `netstat -ano` and `ng serve` flags: which interfaces do ports 3000 and 4200 listen on? Try the dev server from another machine | The API listens on `127.0.0.1` only. A deployed edge is the only public listener | A05 · AP6 | S | No | Expected: API local-only; the dev server depends on its flags. A deployment must expose only the edge |
| **OT-20** | CORS preflight and cross-origin reads | `OPTIONS /api/profile` with `Origin: https://evil.example` and `Access-Control-Request-Headers: content-type`. Then a cross-origin `fetch` of a read route | No `Access-Control-Allow-Origin` for foreign origins. Preflight refused | A05 · R21 · AP10 · TC-09 | A | No | Check: the earlier test found the dev server grants a wide origin |

## A06 Vulnerable and outdated components

| ID | Test | How | Expected secure result | Maps to | Type | Writes? | Today (predicted) |
|---|---|---|---|---|---|---|---|
| **OT-21** | Known advisories in what ships | `npm audit --omit=dev` and `npm audit` | No high or critical advisory in runtime packages. Any exception is recorded with a reason | A06 · T15 · AP7 · TC-21 | S | No | Fail: 8 vulnerable runtime packages were found earlier |
| **OT-22** | Runtime support status | Check the Node version against its support dates, and the `node:sqlite` experimental warning. Check the Angular major version is still supported | A supported Node and Angular line. No experimental module in production without a recorded decision | A06 · T15 | S | No | Check: `node:sqlite` is experimental on the Node used here |

## A07 Identification and authentication failures

| ID | Test | How | Expected secure result | Maps to | Type | Writes? | Today (predicted) |
|---|---|---|---|---|---|---|---|
| **OT-23** | Username enumeration by timing | Send 200 logins for a known name and 200 for an unknown name with a wrong password. Compare median response times | No measurable difference | A07 · R19 · AP1, AP4 · TC-04 | A | No | Check: the unknown-name path returns earlier; a gap would be small |
| **OT-24** | Type confusion at login | `password` missing, `null`, a number, an array, an object; `username` as an array, a number or very long (100 KB) | `401` or `400`. Never `500` | A07 · T13 | A | No | Expected pass: the username is type-checked and the password is compared by equality |
| **OT-25** | Session handling | After login: is a token issued? Does logout end it? Is a new id issued at login? Does it expire when idle? Is it rejected after password change? | `HttpOnly`, `Secure`, `SameSite` cookie, idle and absolute timeouts, invalidated on logout | A07 · T1 · TC-25 | M | No | Future: no sessions exist |

## A08 Software and data integrity failures

| ID | Test | How | Expected secure result | Maps to | Type | Writes? | Today (predicted) |
|---|---|---|---|---|---|---|---|
| **OT-26** | Tamper with the browser-computed result | Edit the `updated` object: `paymentsMade` to `-1` or `99999`, `onTimeStreak` to `99999`, `nextPaymentAmount` to `0`, `nextPaymentDate` to a past date | The server derives these from the ledger, or rejects values that do not follow from it | A08 · T3 · AP3 · TC-10 | A | Yes | Fail: the server accepts any whole-number counters and any valid amount |
| **OT-27** | Install integrity | In a scratch copy, edit one hash in `package-lock.json`, then run `npm ci`. List runtime packages with install scripts | The install fails on the mismatch. No unexplained `postinstall` in runtime packages | A08 · T15 · AP7 | S | No | Expected pass for the hash check. Review the install-script list |
| **OT-28** | Where the data comes from | Compare `db/build.mjs` output with the committed seed. Check the repository for a committed database or backup | No database file or credentials in version control. A seed is reproducible | A08 · R16 · AP5 | S | No | Check: the database is git-ignored, but passwords are in the seed script |

## A09 Security logging and monitoring failures

| ID | Test | How | Expected secure result | Maps to | Type | Writes? | Today (predicted) |
|---|---|---|---|---|---|---|---|
| **OT-29** | Do attacks leave a trace | Make 10 failed logins, a forged payment and a cross-user read. Read the API's output and any log file | One record per event: time, actor, source address, endpoint, outcome. No password or full personal data in it | A09 · T5 · TC-13 | A | Yes | Fail: nothing is logged per request |
| **OT-30** | Log injection | Log in with a username containing `\r\n[api] admin logged in`, then read the log | The injected line appears escaped as data, not as a separate record | A09 · T5 | A | No | Check once logging exists |

## A10 Server-side request forgery

| ID | Test | How | Expected secure result | Maps to | Type | Writes? | Today (predicted) |
|---|---|---|---|---|---|---|---|
| **OT-31** | Steer the Azure relay | With a dummy local listener as the Azure endpoint, call `/api/azure-ai/..%2f..%2fadmin`, `/api/azure-ai//evil.example/x`, `/api/azure-ai/http://127.0.0.1:3000/api/login`, and set `Host` and `X-Forwarded-*` headers | Every request goes only to the configured Azure path. The listener never sees an attacker-chosen host or path | A10 · R20 · AP9 · TC-18 | A | No | Check: depends on the proxy's path rewrite. Only in Azure mode |
| **OT-32** | Does the API fetch any URL | Search `server/` for `fetch`, `http.request`, `https.get`, `child_process`, `exec`. Confirm no route takes a URL | No outbound request is driven by caller input | A10 | S | No | Expected pass: the API only reads SQLite and templates text |
