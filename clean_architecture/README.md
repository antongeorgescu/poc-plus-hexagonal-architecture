# Clean Architecture — Self-Service Loan Servicing POC

An Angular 18 re-implementation of the loan-servicing POC, structured strictly
according to **Robert C. "Uncle Bob" Martin's Clean Architecture**. It is the
same domain as the sibling [`../ntier_architecture`](../ntier_architecture)
project, re-expressed as concentric rings governed by the **Dependency Rule**.

The architecture spec this project follows is
[`../documentation/clean_component_architecture.md`](../documentation/clean_component_architecture.md).

---

## The Dependency Rule (the whole point)

> **All source-code dependencies point inward.** Each ring may name only the
> ring inside it; nothing inner may name anything outer.

```
        ui/  ──────────────┐  (Frameworks & Drivers — Angular, router, DOM)
   infrastructure/ ────────┤  (DI wiring: tokens, providers, guard, session)
        adapters/ ─────────┤  (Interface Adapters: persistence gateways + CLL)
       application/ ───────┤  (Use Cases / Interactors + outbound Ports)
         domain/  ─────────┘  (Entities — enterprise business rules + money math)

     outer  ───────────────►  inner        arrows = "is allowed to import"
```

- `domain/` and `application/` are **pure TypeScript with ZERO `@angular/*`
  imports.** They are the deterministic core (the "BLL").
- The cognitive **CLL** (`adapters/cll/`) is just another **outer-ring
  detail** — a plug-in, exactly like the database or the UI. It *proposes*
  (classifies, narrates, phrases) but it **cannot** compute a balance, a
  payment, or an eligibility decision, because it only depends on the use-case
  ports.
- This replaces the N-Tier version's runtime *Determinism Gate* with a
  **compile-time** guarantee: **delete the entire CLL and every balance,
  payment, and eligibility still computes correctly.**

### Layer folders under `src/app/`

| Ring | Folder | May use Angular? | Contents |
|------|--------|------------------|----------|
| Entities | `domain/` | **No** | `User`, `Loan`, `Payment`, `Borrower`, eligibility — invariants + **all money math** (paid %, months-to-maturity, payment snapshot, payoff validation, eligibility). |
| Use Cases | `application/` | **No** | Interactors (`Authenticate`, `GetLoanInfo`, `GetPaymentSnapshot`, `SubmitPayment`, `GetBorrowerProfile`, `UpdateProfile`, `CheckRateReliefEligibility`) + outbound **ports** (`UserRepositoryPort`, `KnowledgeBasePort`, `ChatHistoryPort`). Plain classes; ports injected via constructor. |
| Interface Adapters | `adapters/` | May | `persistence/` gateways (`CsvUserRepository`, `InMemoryKnowledgeBase`, `InMemoryChatHistory`) implementing the ports; `cll/` cognitive adapters (`InquiryService`, `PersonalizationService`, `ChatInsightsService`, `AccountSummaryService`). |
| Frameworks (DI) | `infrastructure/` | Yes | Angular `InjectionToken`s for every port/use case/CLL service, factory `providers` (composition root), the `authGuard`, and the `SessionStore` (signal service). |
| Frameworks (UI) | `ui/` | Yes | Standalone components: `login/`, `dashboard/`, `inquiry/`, `summary/`, plus `app.component.ts` / `app.routes.ts`. |

---

## How the N-Tier BLL/CLL split maps here

| N-Tier (`ntier_architecture`) | Clean Architecture (this project) |
|-------------------------------|-----------------------------------|
| **BLL** `LoanInfoService`, `PaymentService`, `UserProfileService` (`@Injectable`) | **Entities** (`domain/*.entity.ts`, pure) wrapped by **Use Cases** (`application/use-cases/*`) |
| **CLL** `InquiryService`, `PersonalizationService`, `ChatInsightsService`, `AccountSummaryService` | **CLL adapters** (`adapters/cll/*`) — same responsibilities, now depending *inward* on use-case ports |
| `UserDataService` (`HttpClient` + CSV parse) | `CsvUserRepository` implementing `UserRepositoryPort` (uses `fetch()`) |
| Job catalog / chat history baked into CLL services | Extracted behind `KnowledgeBasePort` / `ChatHistoryPort` gateways |
| `AuthService` signal + `authGuard` | `SessionStore` signal service + `authGuard` (both in `infrastructure/`) |
| `app.config.ts` `providers` | `infrastructure/providers.ts` factory composition root |
| Runtime **Determinism Gate** (`deterministic` flag decides at runtime) | **Dependency Rule** enforced at compile time; `deterministic` flag comes from a **fixed policy map** in `InquiryService`, never from AI |

**"The CLL proposes; the core disposes"** is visible at every seam (each is
commented in code):
- `AccountSummaryService.summarize()` calls `GetBorrowerProfile`,
  `GetLoanInfo`, and `GetPaymentSnapshot` and only *narrates* the result.
- The `ui/inquiry/*` answer components read their numbers from use cases
  (`GetPaymentSnapshot`, `GetLoanInfo`, `SubmitPayment`, …), never from raw
  fields.
- `InquiryService.classify()` sets `deterministic` from `DETERMINISM_POLICY`
  (a fixed business map), not from any model output.

---

## Feature scope

- **Login** with the 6 demo accounts (all password `demo123`), including
  one-click demo sign-in buttons. `authGuard` protects `/dashboard`.
- **Dashboard**: themed welcome per user type; an always-on two-card insights
  panel (Account Summary + Conversation Insights with a sentiment tone-meter);
  an **Ask** box that classifies free text and renders the answer component for
  the category — `NEXT_PAYMENT`, `LOAN_BALANCE`, `EXTRA_PAYMENT` →
  make-payment, `PROFILE_UPDATE` → update-profile, else general help.

### Deliberately omitted / simplified vs. the N-Tier version

- **The full per-user-type personalized card matrix is omitted** (rewards,
  refinance-offer, autopay, budget-tips, hardship-assistance,
  debt-counseling). The focus here is clean layering, not breadth of cards.
- The **HARDSHIP** (job opportunities) and **LIFE_EVENT** (interest-relief)
  *answer components* are not rendered in the dashboard; those inquiries fall
  through to the general-help card. The classifier still recognises them (the
  keyword policy map is faithful to the N-Tier classifier), and the
  `CheckRateReliefEligibility` use case + `KnowledgeBasePort` job catalog are
  fully wired in the core so the personalized UI could be added without touching
  inner rings.
- The `KnowledgeBasePort.getJobsForProgram` gateway is wired and exposed by
  `InquiryService` for grounding, but there is currently no UI that renders its
  output (kept for architectural completeness / future extension).

---

## Run it

Requires Node + npm (Angular 18 officially supports Node 18.19+ / 20.11+ /
22.0+).

```bash
cd POC/clean_architecture
npm install
npm run build      # production build → dist/clean-architecture-loan-poc
npm start          # dev server at http://localhost:4200 (opens the browser)
```

Sign in with any demo account (e.g. `alice` / `demo123`) or use a one-click
demo button on the login screen.
