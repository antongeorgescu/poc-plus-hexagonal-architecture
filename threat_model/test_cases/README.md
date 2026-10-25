# Threat test cases

**System:** Hexagonal Student-Loan POC · **Written:** 2026-10-25 against the code on branch `keyword-search`

Two sets of test cases that extend the [security test plan](../security-test-plan.md) (TC-01 to TC-31). The plan checks each threat once. These sets go wider, with more ways to attack each weakness.

| File | Organised by | IDs | Cases |
|---|---|---|---|
| [owasp-top10-test-cases.md](owasp-top10-test-cases.md) | OWASP Top 10 (2021), A01 to A10 | **OT-01** to **OT-32** | 32 |
| [attack-path-test-cases.md](attack-path-test-cases.md) | The ten attack paths in [attack-paths.png](../attack-paths.png), as end-to-end scenarios | **AT-01** to **AT-12** | 12 |

**Status of every case: Not run.** These are written test cases, not results. When one is run, record the date and the observed result in its row, as the security test plan does.

Each case gives the secure result **expected once the controls in the [remediation plan](../remediation-plan.md) exist**. Today many will fail, because authentication, authorisation and cross-site protection are absent. A failure means the system is insecure in that respect, not that the test is wrong.

---

## 1. Setup

Several cases **change data**. Never run those against a database you care about. Use a throw-away copy on another port, exactly as the security test plan does:

```bash
cp db/data/loanservicing.db /tmp/copy.db
DB_FILE=/tmp/copy.db API_PORT=3100 node server/api.mjs      # disposable instance
API=http://127.0.0.1:3100
```

The commands in the cases use Git Bash syntax and `curl`. Read-only cases can use the normal instance through the dev server (`http://localhost:4200`).

### 1.1 Request templates

**Login** (`POST $API/api/login`): `{"username":"alice","password":"<password>"}`. The response carries `user` with `currentBalance`, `nextPaymentAmount`, `paymentsMade` and `onTimeStreak`, which the payment template needs.

**Payment** (`POST $API/api/payments`), with `B` the current balance:

```json
{"username":"alice","referenceNumber":"OT-0001","fundingSource":"CHEQUING","applyTo":"PRINCIPAL",
 "effectiveDate":"2026-10-25","amount":10,"expectedBalance":B,
 "updated":{"currentBalance":B-10,"nextPaymentAmount":N,"nextPaymentDate":"2026-11-25",
            "paymentsMade":P+1,"onTimeStreak":S+1}}
```

**Profile** (`POST $API/api/profile`): `{"username":"alice","referenceNumber":"OT-P-0001","updated":{"email":"a@example.com","phone":"6135550123","mailingAddress":"1 Test St"}}`. Use a fresh `referenceNumber` every time, or the server answers `409`.

### 1.2 Columns

| Column | Meaning |
|---|---|
| **Writes?** | **Yes** = changes data, disposable instance only. **No** = read-only. |
| **Maps to** | The OWASP category, the attack path (AP), the threat or risk (T, R) and any related existing test (TC). |
| **Type** | A = automatable · M = manual · S = scan or inspection. |

---

## 2. How these relate to the rest of the threat model

| Question | Where |
|---|---|
| Which threat does a case probe? | The **Maps to** column; the threats are in the [risk register](../itsg-33-risk-register.md) and the [threat model](../threat-model.png) |
| Which attack path does it exercise? | [attack-paths.png](../attack-paths.png) |
| Which fix closes it? | [remediation-plan.md](../remediation-plan.md) |
| Where does a result get recorded? | In the case's own row, then summarised in the [security test plan](../security-test-plan.md) |

When a case fails today and the fix is built, rerun it: it becomes the acceptance test for that fix.
