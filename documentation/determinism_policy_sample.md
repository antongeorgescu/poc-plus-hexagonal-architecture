# Determinism Policy — Consolidated Use-Case Register

Every use case from [bll_use_cases.md](bll_use_cases.md) (33) and
[cll_use_cases.md](cll_use_cases.md) (24) in one table, **de-duplicated**: where
the two documents describe the two halves of a single capability, they are
merged into one row rather than listed twice. 57 source cases → **52 rows**.

See [what_drives_it_all.md](what_drives_it_all.md) for the test being applied.

| Layer | Meaning |
|---|---|
| **BLL** | Deterministic. Decides, computes, gates. Reproducible and auditable. |
| **CLL** | Cognitive. Summarizes, predicts, explains, prioritizes, personalizes. Never authoritative. |
| **Split** | One capability, both layers. BLL owns the outcome; CLL owns the phrasing or the ordering. |

The **Comments** column is empty where the assignment is settled. **⚖️** marks a
genuine fringe case — the layer is not determined by the architecture and the
business has to rule on it.

## A. Origination & Onboarding

| # | Use case | Source | Layer | Owns | Comments |
|---|---|---|---|---|---|
| 1 | Borrowing Eligibility Determination | BLL 1 | BLL | Pass/fail + adverse-action reason codes | |
| 2 | Loan Limit Enforcement | BLL 2 | BLL | Annual/aggregate cap arithmetic | |
| 3 | Interest Rate Assignment | BLL 3 | BLL | Rate on the note | |
| 4 | Disbursement Scheduling | BLL 4 | BLL | Amount and release date | |

## B. Interest & Balances

| # | Use case | Source | Layer | Owns | Comments |
|---|---|---|---|---|---|
| 5 | Daily Interest Accrual | BLL 5 | BLL | Per-day interest; must reconcile to the ledger | |
| 6 | Interest Capitalization | BLL 6 | BLL | When accrued interest joins principal | |
| 7 | Current Balance & Payoff Quote | BLL 7 | BLL | Exact payoff as of a date | |
| 8 | Explain My Loan in Plain English | CLL 9 | CLL | Wording only; the projection comes from the engine | ⚖️ The "finish in ~9 years" projection needs a stated assumption set (today's payment and rate). Who owns that disclaimer text — Legal or the CLL — is undecided. |
| 9 | Intelligent Case Deflection ("why did my balance increase?") | CLL 13 | CLL | Explanation grounded in *this* ledger, with citations | ⚖️ At what confidence does the bot stop and hand to a human? Set too high it obstructs a dispute right; too low it never deflects. A risk-appetite call. |

## C. Payments & Transactions

| # | Use case | Source | Layer | Owns | Comments |
|---|---|---|---|---|---|
| 10 | Payment Application (Allocation) | BLL 8 | BLL | Fees → interest → principal split | |
| 11 | Payment Posting & Effective Dating | BLL 9 | BLL | Credit date; drives accrual and late status | |
| 12 | Prepayment / Overpayment Handling | BLL 10 | BLL | Treatment of amounts above due | |
| 13 | Autopay Enrollment & Rate Reduction | BLL 11 | BLL | Binary, event-driven rate benefit | |
| 14 | Refund / Reversal Processing | BLL 12 | BLL | Reversal, re-derived balances, re-aged status | |
| 15 | Payment Trends & Peer Comparison | CLL 2 | CLL | Descriptive trend narrative | ⚖️ **The sharpest fringe case.** Percentile phrasing ("top 40%") is a de-facto score and reintroduces the ranking the source doc rejects. Cohort construction is a fair-lending exposure. Business must rule on whether percentile framing is permitted at all. |
| 16 | Payment Target Suggestions | CLL 3 | CLL | Which scenario to surface, and the framing | ⚖️ Nudging toward overpayment is a UDAAP question, not an architectural one. Whether to suggest overpayment when the borrower may have higher-priority obligations is a policy decision. |

## D. Repayment Plans & Scenarios

| # | Use case | Source | Layer | Owns | Comments |
|---|---|---|---|---|---|
| 17 | Amortization Schedule **+** Personalized Repayment Scenarios | BLL 13 **+** CLL 10 | **Split** | BLL computes every figure; CLL chooses which scenarios to show and explains trade-offs | Merged — the CLL doc explicitly reassigns the numbers to the calculator. |
| 18 | Repayment Plan Selection & Terms | BLL 14 | BLL | Fixed formula per plan; recalculation on switch | |
| 19 | Income-Driven Payment Calculation | BLL 15 | BLL | Discretionary-income formula | |
| 20 | Recertification Date & Recalculation **+** Proactive IDR Assistant | BLL 16 **+** CLL 17 | **Split** | BLL owns the deadline, the new payment and the lapse consequence; CLL predicts lapse risk and nudges | ⚖️ Pre-staging a form with last year's figures blurs "reminder" into "submission". Decide whether pre-fill requires explicit borrower confirmation. |
| 21 | Borrower Success Coach | CLL 14 | CLL | Educational framing of engine-computed savings | ⚖️ "Coaching" edges into regulated financial advice. Where education ends and advice begins is a Legal call, not an architectural one. |

## E. Account Status & Risk

| # | Use case | Source | Layer | Owns | Comments |
|---|---|---|---|---|---|
| 22 | Grace Period Tracking | BLL 17 | BLL | Window duration and repayment start date | |
| 23 | Deferment & Forbearance | BLL 18 | BLL | Eligibility, duration, interest treatment, caps | |
| 24 | Delinquency Aging & Default | BLL 19 | BLL | Day-count buckets; default determination | |
| 25 | Early Distress Detection | CLL 8 | CLL | Risk signal that *surfaces outreach* | ⚖️ The line between "surface help" and "act" is a business call. The moment any downstream action affects credit availability or terms it becomes an adverse action and must move to the BLL with reason codes a score cannot supply. |
| 26 | Personalized Financial Health Summary | CLL 7 | CLL | Narration of a defined metric | ⚖️ Is "repayment health" a BLL metric shown as a status, or CLL colour? The source doc says define it deterministically — but whether the borrower may rely on it is unresolved. |
| 27 | Sentiment-Driven Help Surfacing | CLL 4 | CLL | Tone signal; which help to show | ⚖️ Sentiment may surface help, never change the account. Whether it may *hide* content (e.g. marketing banners) or reorder programs is a policy decision. |
| 28 | Contact-Frequency Limits **+** Delinquency Outreach Optimization | BLL 30 **+** CLL 22 | **Split** | BLL owns the hard caps, consent and quiet hours; CLL optimizes channel, timing and tone *within* them | Merged — "the AI optimizes within the box; it never widens the box." |

## F. Forgiveness, Discharge & Cancellation

| # | Use case | Source | Layer | Owns | Comments |
|---|---|---|---|---|---|
| 29 | Qualifying-Payment Counting **+** PSLF Progress Explainer | BLL 20 **+** CLL 18 | **Split** | BLL holds the authoritative count; CLL explains which payments didn't qualify and why | Merged. Highest-stakes counter on the platform — the CLL may never estimate it. |
| 30 | Discharge / Cancellation Determination | BLL 21 | BLL | Category criteria → outcome, balance, refund | |

## G. Fees & Adjustments

| # | Use case | Source | Layer | Owns | Comments |
|---|---|---|---|---|---|
| 31 | Late Fee Assessment | BLL 22 | BLL | Threshold, amount, regulatory caps | |
| 32 | Servicemember Interest Cap (SCRA-style) | BLL 23 | BLL | Statutory rate cap for the covered period | |

## H. Access, Permissions & Identity

| # | Use case | Source | Layer | Owns | Comments |
|---|---|---|---|---|---|
| 33 | Authentication & Authorization | BLL 24 | BLL | Identity + RBAC on every privileged action | |
| 34 | Feature Entitlement **+** AI Relevance Ordering | BLL 25 **+** CLL 5 | **Split** | BLL grants access; CLL orders granted features by relevance | Merged — BLL 25 is titled "the deterministic half of CLL Case 5". ⚖️ One open question: may the CLL surface a feature the borrower is *not* yet eligible for as an explainer? The doc allows it; it reads uncomfortably close to an offer. |
| 35 | Third-Party & Power-of-Attorney Authorization | BLL 26 | BLL | Scoped disclosure limits | |
| 36 | Recommended Assistance Programs | CLL 12 | CLL | Relevance ranking over BLL-authorized programs | Same "rules grant, AI orders" pattern as row 34; render each with its real eligibility status so "review" never reads as "approved". |

## I. Compliance, Disclosures & Reporting

| # | Use case | Source | Layer | Owns | Comments |
|---|---|---|---|---|---|
| 37 | Truth-in-Lending / APR Disclosure | BLL 27 | BLL | Regulated APR formula, content and timing | |
| 38 | Periodic Billing Statement Generation | BLL 28 | BLL | Required fields on the regulated cadence | |
| 39 | Adverse Action Notices | BLL 29 | BLL | Trigger and specific principal reasons | |
| 40 | Credit-Bureau Reporting | BLL 31 | BLL | What is furnished, and dispute workflow | |
| 41 | Tax Reporting (1098-E-style) | BLL 32 | BLL | Interest-paid statements above threshold | |
| 42 | Data Retention & Purge | BLL 33 | BLL | Retention schedules, purge, legal hold | |
| 43 | Complaint & Dispute Triage | CLL 21 | CLL | Classify, prioritize, summarize, draft | ⚖️ Which complaints count as "regulatory" — and therefore may never be auto-resolved — is a compliance classification the CLL cannot be trusted to make about itself. Needs a deterministic pre-filter. |

## J. Servicing Experience & Support

| # | Use case | Source | Layer | Owns | Comments |
|---|---|---|---|---|---|
| 44 | Summary of Cases Opened | CLL 1 | CLL | Phrasing of counts/statuses retrieved from the case system | Counts and "resolved" statuses are facts, never inferred. |
| 45 | "What Should I Focus On Today?" | CLL 6 | CLL | Prioritization | Dates and amounts remain BLL facts. |
| 46 | Dynamic Home Page | CLL 15 | CLL | Layout and emphasis per borrower | ⚖️ Personalization must never hide legally-required information — but *which* items are legally required is a compliance determination, and that list is exactly the fringe. Needs an explicit always-show register. |
| 47 | Life Event Assistant | CLL 11 | CLL | Detection of life-event signals | ⚖️ Explicit signals (borrower updated employment) vs inferred ones (guessing a marriage) are very different risk profiles. Whether inference is permitted at all is a privacy policy decision. |
| 48 | Servicing-Agent Copilot | CLL 23 | CLL | Summary, likely intents, cited policies, suggested steps | Agent decides and acts; suggestions still pass through BLL rules. |
| 49 | Grounded Policy Q&A (RAG with citations) | CLL 24 | CLL | Retrieve, synthesize, cite, abstain | ⚖️ The abstention threshold is a business setting. Too permissive and it hallucinates policy; too strict and it is useless. |

## K. Documents & Forms

| # | Use case | Source | Layer | Owns | Comments |
|---|---|---|---|---|---|
| 50 | Document Intake & Understanding | CLL 16 | CLL | OCR, extraction, mismatch flags, pre-fill | ⚖️ The confidence threshold at which an extraction auto-fills rather than routing to a human reviewer is a risk-appetite decision, not an architectural one. |
| 51 | Conversational / Guided Form Completion | CLL 19 | CLL | Intent, input gathering, explanation, draft | BLL validates and adjudicates the submission. |

## L. Content, Language & Accessibility

| # | Use case | Source | Layer | Owns | Comments |
|---|---|---|---|---|---|
| 52 | Approved-Content Translation & Accessibility Adaptation | CLL 20 | CLL *(bounded)* | Free-form simplification/translation of **general** content only | ⚖️ The source doc says "draw this line explicitly" and does not draw it. Classifying each content item as *general* (CLL may translate live) or *governed* (pre-approved human translation only) is a per-item business decision, and a mistranslated disclosure is a compliance defect. |

## Summary

| | Count |
|---|---|
| BLL only | 28 |
| CLL only | 19 |
| Split (both layers, one capability) | 5 |
| **Total rows** | **52** |
| Marked ⚖️ fringe | 16 |

## What the merge removed

Five capabilities appeared in both source documents and are now single rows:

| Merged row | BLL source | CLL source |
|---|---|---|
| 17 — Repayment scenarios | 13 Amortization Schedule | 10 Personalized Repayment Scenarios |
| 20 — IDR recertification | 16 Recertification Date | 17 Proactive IDR Assistant |
| 28 — Delinquency outreach | 30 Contact-Frequency Limits | 22 Outreach Optimization |
| 29 — Qualifying-payment count | 20 Qualifying-Payment Counting | 18 PSLF Progress Explainer |
| 34 — Feature entitlement | 25 Feature Entitlement | 5 AI-Discovered Entitlements |

Three further CLL cases (3, 9, 14) consume the amortization engine from row 17
but remain distinct capabilities, so they are listed separately rather than
merged.

> **Cross-reference audit.** Every `Case N` reference in both source documents
> was resolved against its target title while building this register. One was
> stale — `bll_use_cases.md` Case 3 cited *"Case 20 autopay, Case 22 SCRA"* when
> autopay is Case **11** and SCRA is Case **23** — and has been corrected at
> source. All remaining references in both files resolve correctly.
