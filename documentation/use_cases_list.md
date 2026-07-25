# Consolidated Use-Case List — BLL + CLL

All use cases from [bll_use_cases.md](bll_use_cases.md) (deterministic) and [cll_use_cases.md](cll_use_cases.md) (cognitive), ranked in **descending order of relevance**.

* **Relevance (1–5)** is a judgment of overall importance to a student-loan servicing platform — weighing borrower value, business/operational impact, and how central the capability is. **5 = mission-critical / foundational; 1 = niche / nice-to-have.**
* Each **Case Name** is prefixed with its layer — **BLL** (Business Logic Layer, deterministic) or **CLL** (Cognitive Logic Layer, AI-driven).

| # | Case Name | Case Description | Relevance |
|---|-----------|------------------|:---------:|
| 1 | BLL — Daily Interest Accrual | Computes interest added each day via simple daily interest; the most-recomputed figure, must reconcile to statements, payoffs, and the ledger. | 5 |
| 2 | BLL — Payment Application (Allocation) | Splits each received payment across fees, interest, and principal in the regulated order. | 5 |
| 3 | BLL — Amortization Schedule | Derives the level payment amount and payoff timeline for fixed repayment plans. | 5 |
| 4 | BLL — Current Balance & Payoff Quote | Calculates the exact amount to close the loan as of a date (principal + accrued interest + fees − credits). | 5 |
| 5 | BLL — Borrowing Eligibility Determination | Determines whether an applicant qualifies for a product; denials require reproducible adverse-action reasons. | 5 |
| 6 | BLL — Income-Driven Payment Calculation | Computes the monthly payment as a defined percentage of discretionary income. | 5 |
| 7 | BLL — Delinquency Aging & Default | Buckets days past due and declares default at the regulated day count; legally significant and disputable. | 5 |
| 8 | BLL — Qualifying-Payment Counting (PSLF) | Holds the authoritative count of payments toward forgiveness under strict qualifying conditions. | 5 |
| 9 | BLL — Authentication & Authorization | Verifies identity and enforces role-based access to accounts and actions. | 5 |
| 10 | BLL — Feature Entitlement | Rule-based grant of which features and programs a borrower may actually access. | 5 |
| 11 | BLL — Credit-Bureau Reporting | Furnishes account status to bureaus on schedule with FCRA-style accuracy and dispute handling. | 5 |
| 12 | CLL — Dynamic Home Page | Adapts the borrower homepage focus (payment, assistance, forgiveness, cases) while rules stay deterministic. | 5 |
| 13 | CLL — Grounded Policy Q&A (RAG) | Answers policy/account questions from an approved knowledge base + borrower data, with citations and abstention. | 5 |
| 14 | CLL — Explain My Loan in Plain English | Translates complex loan terms and balances into plain, personalized language. | 5 |
| 15 | CLL — Personalized Repayment Scenarios | Presents and compares "what-if" payment scenarios (numbers computed by the deterministic engine). | 5 |
| 16 | CLL — Servicing-Agent Copilot | Gives human agents a live account summary, cited policies, and suggested next steps. | 5 |
| 17 | BLL — Truth-in-Lending / APR Disclosure | Computes APR and generates the prescribed lending disclosures at origination. | 4 |
| 18 | BLL — Periodic Billing Statement Generation | Generates required statement contents on the regulated cadence. | 4 |
| 19 | BLL — Adverse Action Notices | Triggers and populates notices with specific principal reasons when credit is denied or worsened. | 4 |
| 20 | BLL — Interest Capitalization | Adds accrued unpaid interest to principal only on defined events. | 4 |
| 21 | BLL — Payment Posting & Effective Dating | Assigns the credited date from channel/cutoff and recomputes accrual and late status. | 4 |
| 22 | BLL — Repayment Plan Selection & Terms | Applies the fixed formula and terms for Standard / Graduated / Extended / IDR plans. | 4 |
| 23 | BLL — Recertification Date & Recalculation | Computes the annual IDR recertification date and the resulting new payment. | 4 |
| 24 | BLL — Deferment & Forbearance | Checks eligibility, enforces time caps, and applies subsidy-specific interest treatment when payments pause. | 4 |
| 25 | BLL — Grace Period Tracking | Tracks the post-enrollment window and derives the repayment start date. | 4 |
| 26 | BLL — Loan Limit Enforcement | Caps disbursement to annual and aggregate borrowing limits. | 4 |
| 27 | BLL — Interest Rate Assignment | Sets the note rate by product, disbursement date, and index + margin. | 4 |
| 28 | BLL — Contact-Frequency & Communication Limits | Enforces hard caps on call frequency, quiet hours, consent, and channel preferences. | 4 |
| 29 | CLL — Intelligent Case Deflection | Explains a borrower's specific ledger events to resolve questions without opening a support case. | 4 |
| 30 | CLL — Early Distress Detection | Predicts default risk from behavioral signals to surface help early (signal only, never a decision). | 4 |
| 31 | CLL — Feature Relevance / Prioritization | Ranks already-entitled features by predicted usefulness. | 4 |
| 32 | CLL — Forgiveness / PSLF Progress Explainer | Explains where a borrower stands and why payments did or didn't count (count owned by the BLL). | 4 |
| 33 | CLL — Document Intake & Understanding | Extracts and pre-fills fields from uploaded paystubs, enrollment, and tax documents. | 4 |
| 34 | CLL — Proactive IDR Recertification Assistant | Predicts lapse risk and nudges/pre-stages recertification before the deadline. | 4 |
| 35 | CLL — Summary of Cases Opened by User | Summarizes the borrower's support cases, disputes, requests, and resolutions. | 4 |
| 36 | CLL — Payment Target Suggestions | Recommends a payment target given economic context (figures from the engine). | 4 |
| 37 | CLL — Recommended Assistance Programs | Surfaces the most relevant assistance programs, each gated by real eligibility. | 4 |
| 38 | BLL — Autopay Enrollment & Rate Reduction | Applies or removes the autopay interest-rate benefit based on active auto-debit. | 3 |
| 39 | BLL — Prepayment / Overpayment Handling | Applies amounts above the amount due to principal with no penalty. | 3 |
| 40 | BLL — Refund / Reversal Processing | Reverses payments/NSF and re-derives balances, fees, and status. | 3 |
| 41 | BLL — Disbursement Scheduling | Releases funds by term, gated on enrollment confirmation and waiting periods. | 3 |
| 42 | BLL — Late Fee Assessment | Assesses late fees after the threshold, subject to product and regulatory caps. | 3 |
| 43 | BLL — Discharge / Cancellation Determination | Evaluates category-specific criteria (death, disability, closed school) to a definite outcome. | 3 |
| 44 | BLL — Servicemember Interest Cap (SCRA) | Caps the rate at the statutory maximum for eligible active-duty servicemembers. | 3 |
| 45 | BLL — Tax Reporting (1098-E) | Issues interest-paid statements when the reporting threshold is met. | 3 |
| 46 | BLL — Third-Party & Power-of-Attorney Authorization | Enforces scoped authorizations for co-signers, authorized contacts, and POAs. | 3 |
| 47 | BLL — Data Retention & Purge | Applies category-based retention schedules and purges/anonymizes on schedule. | 3 |
| 48 | CLL — "What Should I Focus On Today?" | Generates a prioritized "do this next" dashboard for the borrower. | 3 |
| 49 | CLL — Personalized Financial Health Summary | Narrates deterministic repayment-health metrics (on-time streak, utilization). | 3 |
| 50 | CLL — Frustration-Level Assistance | Detects sentiment/frustration and adapts the UI to surface help and a human path. | 3 |
| 51 | CLL — Conversational / Guided Form Completion | Guides and pre-fills deferment/forbearance/hardship/dispute forms conversationally. | 3 |
| 52 | CLL — Complaint & Dispute Triage | Classifies, routes, and drafts responses to complaints, with human-in-loop. | 3 |
| 53 | CLL — Delinquency Outreach Optimization | Recommends channel, timing, and message to re-engage a borrower within contact limits. | 3 |
| 54 | CLL — Borrower Success Coach | Offers ongoing educational coaching and factual projections (not individualized advice). | 3 |
| 55 | CLL — Payments Trends & Peer Comparison | Shows repayment trends vs anonymized peer cohorts (no ranking or shaming). | 3 |
| 56 | CLL — Life Event Assistant | Detects life-event signals (new employment, return to school) to suggest fitting options. | 2 |
| 57 | CLL — Approved-Content Translation & Accessibility | Simplifies/translates general content; regulated disclosures use approved translations. | 2 |

***

**Totals:** 57 cases — 33 BLL, 24 CLL.
**Relevance distribution:** 5 → 16 cases · 4 → 21 · 3 → 18 · 2 → 2 · 1 → 0.
