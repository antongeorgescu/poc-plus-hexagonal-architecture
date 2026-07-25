This is the deterministic counterpart to [cll_cases.md](cll_cases.md). Where the CLL (Cognitive Logic Layer) *summarizes, predicts, explains, prioritizes, and personalizes*, the **BLL (Business Logic Layer)** *decides* — and it must do so the same way every time, for every borrower, in a way that can be replayed and defended years later.

> **Governing principle (carried over from the CLL review):** eligibility, permissions, money math, and regulatory determinations belong to deterministic rules. The cases below are exactly those "right-column" responsibilities — none of them may be delegated to a model, regardless of model confidence.

***

## What makes a use case belong in the BLL

A use case is deterministic — and belongs here — when it is:

* **Consequential & regulated** — it moves money, changes access, or affects credit.
* **Reproducible** — the same inputs must always produce the same output, to the cent.
* **Explainable & auditable** — every result traces to a specific rule, version, and input.
* **Testable** — expressible as fixed inputs → expected outputs (regression-tested).
* **Versioned** — when a rule changes, prior decisions remain reconstructable under the rule in force at the time.

If a capability has these properties, an LLM is the wrong tool for the decision — even if it's the right tool for *explaining* the decision afterward.

***

# A. Origination & Onboarding

## 1. Borrowing Eligibility Determination

**Decides:** whether an applicant qualifies for a given loan product.

**Rule:** enrollment status, program of study, cost of attendance, prior aid received, and (for private products) credit criteria are evaluated against fixed thresholds. Pass/fail with reasons.

> Enrolled at least half-time + within cost-of-attendance + within aggregate limit ⇒ **eligible**.

**Why deterministic:** a denial is an **adverse action** requiring specific, accurate reasons (ECOA/Reg B-style). A model cannot supply reproducible reason codes.

***

## 2. Loan Limit Enforcement

**Decides:** the maximum that may be disbursed.

**Rule:** annual and aggregate borrowing limits by dependency status, program level, and year in school. `requested = min(requested, annual_remaining, aggregate_remaining)`.

> Aggregate cap $31,000; already borrowed $27,000 ⇒ new loan capped at **$4,000**.

***

## 3. Interest Rate Assignment

**Decides:** the rate placed on the note.

**Rule:** rate is set by product, disbursement date, and (for variable products) an index + margin. Fixed once disbursed unless a rule-based modifier applies (see Case 20 autopay, Case 22 SCRA).

***

## 4. Disbursement Scheduling

**Decides:** how much is released and when.

**Rule:** split by academic term, gated on enrollment confirmation and any required waiting periods. No disbursement without the deterministic pre-conditions met.

***

# B. Interest & Balances

## 5. Daily Interest Accrual

**Decides:** interest added each day.

**Rule (simple daily interest):**

```text
daily_interest = outstanding_principal × (annual_rate / days_in_year)
```

Accrue per day; sum over the period.

> $35,000 × (5.00% / 365) ≈ **$4.79/day**.

**Why deterministic:** this is the single most-recomputed number on the platform; it must reconcile exactly with statements, payoff quotes, and the general ledger.

***

## 6. Interest Capitalization

**Decides:** when accrued unpaid interest is added to principal.

**Rule:** capitalization occurs only on defined events (end of grace, end of deferment/forbearance, plan changes, as permitted by product and regulation). Outside those events, interest is **never** capitalized.

> End of forbearance: accrued interest $612 is added to principal, which becomes the new accrual base.

***

## 7. Current Balance & Payoff Quote

**Decides:** the exact amount to close the loan as of a date.

**Rule:**

```text
payoff(date) = outstanding_principal
             + accrued_interest_through(date)
             + outstanding_fees
             − unapplied_credits
```

Valid only through the quoted date because interest keeps accruing.

***

# C. Payments & Transactions

## 8. Payment Application (Allocation)

**Decides:** how a received payment is split.

**Rule:** apply in the regulated/policy order — typically **outstanding fees → accrued interest → principal** — unless the borrower validly directs otherwise (e.g., extra-to-principal).

> $300 payment, $10 fee + $120 interest outstanding ⇒ $10 fee, $120 interest, **$170 principal**.

***

## 9. Payment Posting & Effective Dating

**Decides:** the date a payment is credited.

**Rule:** effective date derived from receipt channel and cutoff times; interest is recomputed from the effective date. Deterministic so accrual and late status are unambiguous.

***

## 10. Prepayment / Overpayment Handling

**Decides:** treatment of amounts above the amount due.

**Rule:** no prepayment penalty (federal); excess applies to principal after covering fees/interest, or per borrower direction. Recompute amortization/payoff accordingly.

***

## 11. Autopay Enrollment & Rate Reduction

**Decides:** whether the autopay interest-rate benefit applies.

**Rule:** active, successful automatic debit ⇒ apply the fixed rate reduction (commonly 0.25%); lapses remove it per rule. Binary, event-driven.

***

## 12. Refund / Reversal Processing

**Decides:** how returned payments, NSF reversals, and overpayment refunds are booked.

**Rule:** reverse the original application deterministically, re-derive balances and any resulting fee, and re-age status from the corrected ledger.

***

# D. Repayment Plans

## 13. Amortization Schedule

**Decides:** the payment amount and payoff timeline for fixed plans.

**Rule (standard level payment):**

```text
P = principal × [ i(1+i)^n ] / [ (1+i)^n − 1 ]
    where i = monthly_rate, n = number_of_payments
```

> $35,000 @ 5% over 120 months ⇒ ≈ **$371/month**.

***

## 14. Repayment Plan Selection & Terms

**Decides:** the terms of Standard, Graduated, Extended, and Income-Driven plans.

**Rule:** each plan is a fixed formula. Graduated escalates on a schedule; Extended lengthens the term; a switch triggers a deterministic recalculation from the current balance.

***

## 15. Income-Driven Payment Calculation

**Decides:** the monthly payment under an income-driven plan.

**Rule:** payment is a defined percentage of **discretionary income** (income minus a multiple of the applicable poverty guideline for family size), divided by 12, subject to the plan's rules and any cap.

```text
discretionary_income = AGI − (multiplier × poverty_guideline(family_size))
monthly_payment      = (percentage × discretionary_income) / 12
```

**Why deterministic:** the borrower's payment — and their exposure to under- or over-payment — rides entirely on this formula; it must match the official calculation exactly.

***

## 16. Recertification Date & Recalculation

**Decides:** when income/family size must be re-verified and the resulting new payment.

**Rule:** recertification is due on a fixed annual cycle; a missed deadline triggers the rule-defined consequence (e.g., payment recalculated to the standard amount). Dates and consequences are computed, not predicted. *(The CLL may **remind**; the BLL owns the date and the outcome.)*

***

# E. Account Status

## 17. Grace Period Tracking

**Decides:** the post-enrollment window before repayment begins.

**Rule:** fixed duration (commonly 6 months for many federal loans) starting at the enrollment-drop event; repayment start date is derived from it.

***

## 18. Deferment & Forbearance

**Decides:** eligibility, duration, and interest treatment when payments are paused.

**Rule:** eligibility is checked against defined categories (in-school, unemployment, economic hardship, military, etc.); cumulative-time caps are enforced; interest treatment differs by subsidy type (e.g., subsidized interest may be covered during qualifying deferment, otherwise it accrues).

***

## 19. Delinquency Aging & Default

**Decides:** delinquency buckets and the default determination.

**Rule:** aging by days past due (30 / 60 / 90 / 120 …); credit-bureau reporting triggers at the defined threshold; **default** is declared at the regulated day count (commonly ~270 days for federal loans). Pure date arithmetic against the last satisfied due date.

**Why deterministic:** default and credit reporting are legally significant and disputable — they must be reconstructable to the exact day.

***

# F. Forgiveness, Discharge & Cancellation

## 20. Qualifying-Payment Counting (e.g., PSLF)

**Decides:** how many payments count toward a forgiveness program.

**Rule:** a payment qualifies only if it meets every defined condition (on-time, full amount, under a qualifying plan, during qualifying employment). Count = sum of qualifying months; forgiveness at the defined total (e.g., 120).

**Why deterministic:** this is the highest-stakes counter on the platform. The AI may **explain why a payment didn't count**; only the BLL may **hold the count**.

***

## 21. Discharge / Cancellation Determination

**Decides:** eligibility for discharge (death, total-and-permanent disability, closed school, etc.).

**Rule:** documented, category-specific criteria evaluated to a definite outcome; the balance and any refund are computed by rule.

***

# G. Fees & Adjustments

## 22. Late Fee Assessment

**Decides:** whether and how much late fee applies.

**Rule:** assessed only after the grace-to-late threshold, subject to product and regulatory caps (percentage-of-payment or flat, capped). No discretionary application.

***

## 23. Servicemember Interest Cap (SCRA-style)

**Decides:** the reduced interest rate for eligible active-duty servicemembers.

**Rule:** on valid eligibility, cap the rate at the statutory maximum (commonly 6%) for the covered period; excess interest is forgiven, not deferred. Event-driven and reversible when the period ends.

***

# H. Access, Permissions & Identity

## 24. Authentication & Authorization

**Decides:** who may act on an account and what they may do.

**Rule:** identity verification + role-based access control. Every privileged action checks a permission; results are logged.

***

## 25. Feature Entitlement (the deterministic half of CLL Case 5)

**Decides:** which features/programs a borrower may actually access.

**Rule:** eligibility rules grant access; the CLL may only **order** already-granted features by relevance. Access is never a model output.

***

## 26. Third-Party & Power-of-Attorney Authorization

**Decides:** what a co-signer, authorized contact, or POA may see or do.

**Rule:** scoped, documented authorizations enforced deterministically; disclosure is limited to the authorized scope.

***

# I. Compliance, Disclosures & Reporting

## 27. Truth-in-Lending / APR Disclosure

**Decides:** the APR and disclosure content at origination.

**Rule:** APR and payment disclosures computed by the regulated formula; content and timing are prescribed. No interpretation.

***

## 28. Periodic Billing Statement Generation

**Decides:** statement contents and issuance timing.

**Rule:** required fields (amount due, due date, allocation of last payment, fees, contact info) generated on the regulated cadence.

***

## 29. Adverse Action Notices

**Decides:** when a notice is required and what it must contain.

**Rule:** triggered by a denial or adverse change in terms; content includes the specific principal reasons — which is precisely why the underlying decision (Case 1) must be deterministic.

***

## 30. Contact-Frequency & Communication Limits

**Decides:** how often and when the servicer may contact a borrower about amounts owed.

**Rule:** hard caps on call frequency and quiet hours, plus consent and channel preferences (collections rules / state law). The CLL may **optimize within** these limits; it can never widen them.

***

## 31. Credit-Bureau Reporting

**Decides:** what is furnished to consumer reporting agencies and when.

**Rule:** furnish per the defined schedule and accuracy standards (FCRA-style); disputes follow a prescribed investigation-and-correction workflow.

***

## 32. Tax Reporting (1098-E-style)

**Decides:** interest-paid statements to borrowers/authorities.

**Rule:** issue when interest paid meets the reporting threshold (commonly $600) for the tax year; amounts summed deterministically from posted payments.

***

## 33. Data Retention & Purge

**Decides:** how long records are kept and when they're purged.

**Rule:** category-based retention schedules; purge/anonymize on schedule while preserving what audit and legal-hold require.

***

# Why the whole set stays deterministic

| Property | What it buys you |
|---|---|
| **Reproducibility** | Statements, payoffs, and the ledger always reconcile. |
| **Explainability** | Every decision cites a rule + inputs — survivable in an audit or dispute. |
| **Versioning** | Old decisions replay under the rule that was in force at the time. |
| **Testability** | Fixed input → expected output; regression-protected on every change. |
| **Non-repudiation** | No "the model felt like it" — outcomes are defensible. |

***

# Where the BLL hands off to the CLL

The two layers are partners, not rivals:

* **BLL → CLL:** the rules engine produces authoritative facts and decisions; the CLL turns them into a summary, a plain-language explanation, a prioritized dashboard, or a nudge.
* **CLL → BLL:** the AI interprets intent, drafts, and recommends; every consequential result is then **gated through** the deterministic engine before it reaches the borrower.

> Rule of thumb: **if getting it wrong costs money, access, or a regulatory finding, it lives in this file.** Everything interpretive, explanatory, or personalizing lives in [cll_cases.md](cll_cases.md).

***

> **Closing principle:** the BLL is the platform's source of truth — the layer that must be *right*, *repeatable*, and *provable*. The CLL makes that truth *usable*. Keep the decision here; let the AI make it understandable.
