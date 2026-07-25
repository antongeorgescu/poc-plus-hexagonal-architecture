# Self-Service Loan Servicing — Angular POC

A proof-of-concept, self-service loan servicing web app built with **Angular 18**
(standalone components + signals). After a mock login, the UI is **composed
dynamically from Angular components** that are personalized to the borrower's
standing and to the intent of their free-text inquiry. An always-on **insights
panel** (Account Summary + Conversation Insights) greets every borrower, and the
logic tier is split into a deterministic **BLL seat** and a cognitive **CLL
seat**, following the *"CLL narrates, BLL decides"* rule.

> Everything runs on **synthetic data and mock answers** — no backend and no AI
> services are called.

---

## Prerequisites

This machine did **not** have Node.js installed when the project was generated, so
the project could not be built here. To run it you need:

- **Node.js 18.19+ or 20+** (LTS recommended) — <https://nodejs.org>
- npm (bundled with Node)

## Run it

```bash
cd POC
npm install
npm start
```

`npm start` runs `ng serve --open` and opens <http://localhost:4200>.

## Demo accounts

All passwords are `demo123`. Data lives in [`src/assets/users.csv`](src/assets/users.csv)
— **one row per user**.

| Username | Type | Standing |
|----------|------|----------|
| `alice`, `grace` | 1 | Excellent — highly successful at paying |
| `bob`, `henry`   | 2 | Delinquency grade 1 — occasionally misses a payment |
| `carol`, `irene` | 3 | Delinquency grade 2 — stopped paying |

On the login screen you can also click a demo button to sign in with one click.

---

## How it works

### 1. Data — one CSV, one row per user
[`UserDataService`](src/app/services/user-data.service.ts) loads
`assets/users.csv` over HTTP and parses each row into a typed
[`User`](src/app/models/user.model.ts). This is the single source of truth for
credentials, loan figures, program of study, and delinquency type.

### 2. Mock authentication
[`AuthService`](src/app/services/auth.service.ts) validates the username/password
against the CSV rows and stores the authenticated user in a signal. The
`/dashboard` route is protected by [`authGuard`](src/app/services/auth.guard.ts).

### 3. Personalized welcome (themed per user type)
[`PersonalizationService`](src/app/services/personalization.service.ts) returns a
greeting, a polite "how can we help?" question, suggested prompts, and a **CSS
theme class** (`theme-1/2/3`) whose tone matches the borrower:

- **Type 1** — upbeat, rewards-oriented (teal/green theme)
- **Type 2** — encouraging, stay-on-track (amber theme)
- **Type 3** — empathetic, supportive (indigo theme)

### 4. Always-on insights panel — Account Summary + Conversation Insights (CLL)
As soon as the dashboard loads, two **cognitive (CLL) cards** render side-by-side
for every user, *before* any question is asked:

- **Account Summary** ([`AccountSummaryComponent`](src/app/components/summary/account-summary.component.ts))
  — [`AccountSummaryService`](src/app/services/account-summary.service.ts) *narrates*
  a plain-English summary of the loan and payment picture. It **computes nothing
  itself**: it aggregates deterministic facts from the BLL seat (below) —
  [`UserProfileService`](src/app/bll/user-profile.service.ts),
  [`LoanInfoService`](src/app/bll/loan-info.service.ts), and
  [`PaymentService`](src/app/bll/payment.service.ts) — and only phrases them.
- **Conversation Insights** ([`ChatInsightsComponent`](src/app/components/summary/chat-insights.component.ts))
  — [`ChatInsightsService`](src/app/services/chat-insights.service.ts) summarizes the
  borrower's (synthetic) Live Chat + Chatbot history and renders a **sentiment
  tone-meter** (score, label, emoji, and a supportive one-liner). Tone tracks user
  type: engaged/positive for type 1, tense for type 2, frustrated — or no usable
  history — for type 3.

This is the POC's clearest illustration of the **"CLL narrates, BLL decides"** rule.

### 5. The deterministic BLL seat
The [`src/app/bll/`](src/app/bll/) folder holds the **deterministic fact/decision
services** — the authoritative source for every figure the UI shows:

- [`UserProfileService`](src/app/bll/user-profile.service.ts) — borrower profile, standing, contact updates.
- [`LoanInfoService`](src/app/bll/loan-info.service.ts) — balances, interest rate, maturity, paid %.
- [`PaymentService`](src/app/bll/payment.service.ts) — money math, reference numbers, and `getPaymentSnapshot()`.

The CLL services (`AccountSummaryService`, `InquiryService`, …) may *call* and
*phrase* these results, but never substitute for them. See
[`documentation/component_diagram.md`](documentation/component_diagram.md) and
[`documentation/plus_architecture.md`](documentation/plus_architecture.md).

### 6. Inquiry → dynamic component composition
The user types a question. [`InquiryService`](src/app/services/inquiry.service.ts)
classifies it (mock keyword matching) into a category, then the
[`DashboardComponent`](src/app/components/dashboard/dashboard.component.ts)
composes the response:

| Inquiry | Category | Deterministic? | Components shown |
|---------|----------|----------------|------------------|
| "When is my next payment due and its amount?" | `NEXT_PAYMENT` | ✅ Same for all | `NextPaymentComponent` |
| "What's my balance and maturity date?" | `LOAN_BALANCE` | ✅ Same for all | `LoanBalanceComponent` |
| "I lost my job and may miss payments" | `HARDSHIP` | ❌ Personalized | `JobOpportunitiesComponent` (jobs matched to **program of study** + area) **+ user-type set** |
| "I just had my first child — interest rate relief?" | `LIFE_EVENT` | ❌ Personalized | `InterestReliefComponent` (eligibility by type) **+ user-type set** |
| anything else | `GENERAL` | ❌ Personalized | `GeneralHelpComponent` **+ user-type set** |

**Rule:** for the **deterministic** payment/loan inquiries the exact same
components are rendered for every user type. For the **non-deterministic**
inquiries the answer component is shown **plus** the personalized set for the
user's type:

- **Type 1:** [`RewardsComponent`](src/app/components/personalized/rewards.component.ts) + [`RefinanceOfferComponent`](src/app/components/personalized/refinance-offer.component.ts)
- **Type 2:** [`AutopayComponent`](src/app/components/personalized/autopay.component.ts) + [`BudgetTipsComponent`](src/app/components/personalized/budget-tips.component.ts)
- **Type 3:** [`HardshipAssistanceComponent`](src/app/components/personalized/hardship-assistance.component.ts) + [`DebtCounselingComponent`](src/app/components/personalized/debt-counseling.component.ts)

---

## Project structure

```
POC/
├─ src/
│  ├─ assets/users.csv               # single source of user data (1 row / user)
│  ├─ styles.scss                    # global styles + per-type theme variables
│  └─ app/
│     ├─ models/                     # User + Inquiry types
│     ├─ bll/                        # deterministic seat — authoritative facts & money math
│     │  ├─ user-profile.service.ts  # borrower profile · standing · contact updates
│     │  ├─ loan-info.service.ts     # balances · rate · maturity · paid %
│     │  └─ payment.service.ts       # money math · reference no. · getPaymentSnapshot()
│     ├─ services/                   # cognitive (CLL) + platform services
│     │  ├─ user-data.service.ts     # CSV loader + parser
│     │  ├─ auth.service.ts          # mock auth (signals)
│     │  ├─ auth.guard.ts            # route guard
│     │  ├─ inquiry.service.ts       # classifier + mock jobs / rate relief
│     │  ├─ personalization.service.ts # per-type welcome + theme
│     │  ├─ account-summary.service.ts # CLL — narrates the BLL facts
│     │  └─ chat-insights.service.ts   # CLL — chat summary + sentiment
│     └─ components/
│        ├─ login/                   # sign-in screen
│        ├─ dashboard/               # orchestrator (composes the UI)
│        ├─ summary/                 # always-on Account Summary + Conversation Insights
│        ├─ inquiry/                 # answer components (per category)
│        └─ personalized/            # per-user-type component sets
└─ angular.json, package.json, tsconfig*.json
```

## Try this flow

1. Sign in as **carol** (delinquency grade 2).
2. Ask *"I may not be able to make payments — I lost my job"* → you'll see
   job openings matched to Culinary Arts near Miami, plus hardship assistance
   and free counseling cards (personalized for type 3).
3. Sign out, sign in as **alice** (excellent standing), ask the same question →
   the job matches change to her field/area, and the personalized cards become
   rewards + a refinance offer.
4. As any user, ask *"when is my next payment due?"* → the identical
   `NextPaymentComponent` is shown regardless of type (deterministic).
```
