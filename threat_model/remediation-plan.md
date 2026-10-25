# Remediation plan (plan of action and milestones)

**System:** Hexagonal Student-Loan POC · **Prepared:** 2026-10-25 · **Status of every item:** *Open*
**Inputs:** [itsg-33-risk-register.md](itsg-33-risk-register.md) (risks T1–T15, R16–R22) · [attack-paths.png](attack-paths.png) (AP1–AP10, controls C1–C10)
**Verification:** each item is closed by tests in [security-test-plan.md](security-test-plan.md) (TC-nn)

The risk register says *what* is wrong. This plan turns it into tracked work: what to do, in what order, who owns it, how big it is, and how to know it is done. Items are tracked as **REM-nn**.

> **Owners are roles, not people.** Names and dates are left for the system owner to assign. Effort is a rough size for one developer who already knows this code: **S** under a day · **M** one to three days · **L** one to two weeks. Treat the sizes as estimates, not commitments.

---

## 1. Phases

| Phase | Meaning | Gate |
|---|---|---|
| **0** | Must be done before the app is reachable from anywhere but this machine, and before any real borrower data is loaded. | No real data until Phase 0 is closed. |
| **1** | Must be done before a production launch. | No launch until Phase 1 is closed or each open item is formally accepted. |
| **2** | Ongoing hardening and governance. | Reviewed on the schedule in [README.md](README.md). |

---

## 2. Work items

### Phase 0 — before any exposure or real data

| ID | Action | Closes | ITSG-33 | Owner | Effort | Depends on | Done when |
|---|---|---|---|---|---|---|---|
| **REM-02** | Hash passwords (scrypt or argon2id); remove credentials from the seed file and the README; rotate the demo passwords. | T6, AP5 | IA-5, SC-28 | Dev lead | **S–M** | — | TC-05 passes: no plain-text password in the database or repository; the demo password no longer appears in the README. |
| **REM-01** | Server-side sessions and a request context that says who the caller is. | T1, T7, AP1, AP2, AP4 | IA-8, AC-3, AC-12, SC-23 | Dev lead | **L** | REM-02 | Session cookie issued with the right attributes and timeouts (TC-25); requests without a session are refused. |
| **REM-03** | Scope every query to the session; remove `username` from request bodies and query strings; answer unknown and unauthorised identically. | T1, T7, R19, AP1, AP2, AP3 (others) | AC-3, AC-6, IA-6 | Dev lead | **M** | REM-01 | TC-01, TC-02 and TC-04 all show refusal; no endpoint accepts a borrower identifier from the client. |
| **REM-04** | CSRF defence, JSON-only and `Origin` checks in the API, and removal of the wildcard CORS. | R21, AP10 | SC-23, SC-7, CM-7 | Dev lead | **S–M** | REM-01 | TC-09 and TC-28: a cross-origin read is blocked and a `text/plain` POST is refused (`415`). |
| **REM-05** | Move the payment, schedule and profile **decisions** to the server; make references on the server; require an idempotency key. | T3, T4, AP3 | SI-10, SA-8 | Dev lead | **L** | REM-03 | TC-10 and TC-11: forged schedule fields are rejected; replaying a request records nothing new. |
| **REM-06** | Throttle and lock out logins per account and per source. | T2, AP4 | AC-7, SC-5 | Dev lead | **M** | REM-01 | TC-03: after 5 failures the account is refused for 15 minutes with the same message. |
| **REM-07** | TLS in front of everything, with HSTS. | T8, AP6 | SC-8 / SC-9, SC-13 | Ops / platform | **S** (infrastructure) | — | TC-07: plain HTTP is redirected or refused; HSTS present. |
| **REM-08** | Authenticated audit log: actor, source, endpoint, outcome. | T5 | AU-2, AU-3, AU-12 | Dev lead | **M** | REM-01 | TC-13: every write and every denial appears with an actor. |

### Phase 1 — before production

| ID | Action | Closes | ITSG-33 | Owner | Effort | Depends on | Done when |
|---|---|---|---|---|---|---|---|
| **REM-21** | Step-up authentication for contact and high-value changes, notices to the old address, password reset, MFA. | T2, AP2 | IA-5, IA-8 | Dev lead | **L** | REM-01, REM-06 | TC-29: changing contact details requires re-authentication and notifies the old address. |
| **REM-09** | Rate limits and request timeouts at the edge. | T11, AP8 | SC-5, SC-7 | Ops / platform | **M** | REM-07 | A flood is shed with `429`; legitimate requests still complete. |
| **REM-10** | Lock down the Azure path: authenticate it, add a spend budget and alerts, **minimise what is sent**, and remove the `directKey` mode. | T9, T10, R20, AP9 | AC-3, SC-12, CM-7, SA-9 | Dev lead + Privacy officer | **M** | REM-01 | TC-18, TC-19, TC-20: the route refuses anonymous callers; the payload contains no exact balances or names. |
| **REM-11** | Plan and carry out the **major** Angular upgrade (the fixes are only in newer major versions); run `npm audit` in CI; enable Dependabot; regenerate the SBOM; move to a supported LTS Node release. | T15, AP7 | SI-2, SA-12, CM-8 | Dev lead | **M–L** | — | TC-21: no high or critical advisory in runtime packages; the build runs on a supported Node line. |
| **REM-12** | Scheduled encrypted backups; a guard so `db:build` refuses to run against a database holding real data; a tested restore; a ledger reconciliation job. | R17 | CP-9, CP-10 | Ops / platform | **M** | — | TC-22 and TC-27: a backup is restored and the reconciliation query returns no rows. |
| **REM-13** | Encrypt the database at rest; restrict file permissions to the service account. | R16 | SC-28, MP-4 | Ops / platform | **S–M** | — | TC-23: the file is unreadable to other accounts and the volume is encrypted. |
| **REM-14** | Security tests in CI: authorisation, tampering, abuse and the regression table. | R18 | SA-11, CA-2, RA-5 | Dev lead | **M** | REM-03 | CI fails on any TC-01 to TC-04, TC-09 or TC-10 regression. |
| **REM-15** | Self-host the fonts (or use system fonts) and set a Content-Security-Policy. | R22 | SC-7, SA-9 | Dev lead | **S** | — | TC-24: no third-party request on page load. |
| **REM-19** | Production baseline: security headers, source maps off, no dev server in production, secrets from a store. | T15 (config), T9 | CM-2, CM-6, CM-7 | Ops / platform | **S–M** | REM-07 | TC-08: HSTS, CSP, `X-Content-Type-Options`, `Referrer-Policy` present. |

### Phase 2 — governance and ongoing

| ID | Action | Closes | ITSG-33 | Owner | Effort | Depends on | Done when |
|---|---|---|---|---|---|---|---|
| **REM-16** | Incident response plan and alerting built on the audit log. | detection of AP1–AP4, AP8 | IR-4, IR-5, IR-6, SI-4 | System owner + Ops | **M** | REM-08 | The detections in [logging-incident-recovery.md](logging-incident-recovery.md) fire in a drill. |
| **REM-17** | Privacy: a privacy impact assessment, retention schedule, minimisation of the credit score and contact snapshots, and a way to view and correct personal information. | privacy | RA-3, PL-2 | Privacy officer | **M–L** | decisions in [data-inventory-and-categorization.md](data-inventory-and-categorization.md) | PIA approved; a retention period exists for every table. |
| **REM-18** | Security categorization, profile selection and a formal assessment and authorization. | governance | RA-2, CA-2, CA-6, CA-7 | System owner + Security assessor | **L** | REM-01 to REM-08 | A signed authorization decision. |
| **REM-20** | Keep guarding the controls that already work: tests for SQL injection, regex cost, input caps and prompt-injection handling. | T12, T13, T14 | SI-10 | Dev lead | **S** | — | TC-15, TC-16, TC-17, TC-30 run in CI and pass. |

---

## 3. Order and dependencies

```
REM-02 ─► REM-01 ─► REM-03 ─► REM-04
              │        └────► REM-05
              ├────► REM-06 ─► REM-21
              ├────► REM-08 ─► REM-16
              └────► REM-10
REM-07 ─► REM-09 ─► (REM-19)          REM-11   REM-12   REM-13   REM-15   (independent)
```

**Where to start:** REM-02, then REM-01, REM-03 and REM-04. Together they close the three paths that need no special skill (AP1, AP2, AP3 against others) and the browser-based attack (AP10). REM-07 can run in parallel because it is infrastructure only.

---

## 4. Risk treatment decisions

For each risk the owner chooses to **fix**, **accept**, **transfer** or **avoid**. The proposed treatment is below; the decision columns are for the owner to fill in.

| Risk | Rating | Proposed treatment | Condition if accepted | Decision | Accepted by / date |
|---|---|---|---|---|---|
| T1, T2, T3, T6, T7, R21 | High | **Fix** (REM-01 to REM-06, REM-02) | Acceptable **only** while the API is bound to `127.0.0.1`, the dev server is not left running while browsing untrusted sites, the database holds no real data, and demo credentials are not reused | | |
| T4, T5, T8, T11, R16, R17, R18, R19, R20 | Medium | **Fix** (Phase 0/1) | — | | |
| T9, T15 | Medium | **Fix** (REM-10, REM-11) | — | | |
| T10 | Medium | **Avoid** while Azure is off; **fix** (REM-10) before it is enabled | Azure OpenAI stays disabled for real borrower data | | |
| R22 | Low | **Fix** (REM-15) | Accept for the POC only | | |
| T12, T13, T14 | Low | **Accept** (already mitigated) | Regression tests keep them mitigated (REM-20) | | |

### Sign-off

| Role | Name | Decision | Date |
|---|---|---|---|
| System owner | | | |
| Security authority | | | |
| Privacy officer | | | |

---

## 5. Tracking

| Metric | Now |
|---|---|
| Items open | 21 of 21 |
| Phase 0 open | 8 |
| High risks open | 6 (T1, T2, T3, T6, T7, R21) |
| Controls already working | 5 (see section 5 of the [risk register](itsg-33-risk-register.md)) |

Update the counts, and mark each item as it is closed, whenever its status changes. The review triggers are listed in [README.md](README.md).
