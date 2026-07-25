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

---

## The Determinism Gate

> Also called the **deterministic gateway**. The repo's architecture docs
> ([`component_diagram.md`](documentation/component_diagram.md),
> [`plus_architecture.md`](documentation/plus_architecture.md)) name it the
> **Determinism Gate** — that's the term used here.

### Core concept

The POC follows the **Plus architecture**, in which the logic tier has two "seats":

- a **cognitive seat (CLL)** — the AI-style services that *classify, summarize,
  predict, personalize, and narrate*. They **propose**.
- a **deterministic seat (BLL)** — the rules-and-math services that *decide*:
  eligibility, permissions, money math, and regulatory outcomes. They produce
  authoritative facts that must be reproducible, explainable, and auditable.

The **Determinism Gate is the boundary between the two**, and it enforces a single
invariant:

> **The CLL proposes; the BLL disposes.**

The AI may decide *what to show and how to phrase it*, but any value that matters —
money, access, a regulated outcome — must be **produced or authorized by the
deterministic side before it reaches the user**. The AI is *grounded* before it
reasons and *gated* before its output is shown.

**Why it matters:** because the model never owns a consequential decision, the
system stays reproducible (same input → same output), explainable (every result
traces to a rule + inputs), and auditable. The AI becomes **non-load-bearing for
decisions** — you could swap the model, or remove it entirely, and every balance,
payment, and access decision would be unchanged. Architecturally the boundary can
be enforced at *runtime* (an explicit gate, as in N-Tier Plus) or at *compile-time*
via the dependency rule (as in Clean Plus); this POC demonstrates the
**runtime-gate** style.

### How it's implemented in the Angular POC

There is **no single `DeterminismGate` class** — the gate is *conceptual*, realized
by three concrete code mechanisms.

#### Mechanism 1 — The `deterministic` flag on `InquiryResult`

The gate's central data contract. The classifier stamps each inquiry as
deterministic or not; the UI later obeys that flag.

[`inquiry.model.ts`](src/app/models/inquiry.model.ts):
```ts
export interface InquiryResult {
  category: InquiryCategory;
  /** True when the response components are identical for every user type. */
  deterministic: boolean;
  label: string;
}
```

[`inquiry.service.ts`](src/app/services/inquiry.service.ts) — the classifier is
where each category is *declared* deterministic (payment/balance/profile →
`true`) or personalized (hardship/life-event/general → `false`):
```ts
classify(text: string): InquiryResult {
  for (const rule of this.rules) {
    if (rule.keywords.some((k) => k.test(text))) {
      return { category: rule.category, deterministic: rule.deterministic, label: rule.label };
    }
  }
  return { category: 'GENERAL', deterministic: false, label: 'General help' };
}
```
The doc comment notes *"In a real system this would call an AI service"* — i.e.
`InquiryService` stands in for the CLL that **proposes**, and the `deterministic`
flag is what the gate then enforces.

#### Mechanism 2 — The Dashboard composition rule

This is the gate's actual enforcement point. The template branches on
`deterministic` to decide **what the borrower is allowed to see**: deterministic
answers render the *same* single component for everyone; only non-deterministic
answers get the per-user-type personalized set added.

[`dashboard.component.html`](src/app/components/dashboard/dashboard.component.html):
```html
<!-- 2) Personalized set — only for non-deterministic inquiries -->
@if (!entry.result.deterministic) {
  @switch (u.userType) {
    @case (1) { <app-rewards [user]="u" /> <app-refinance-offer [user]="u" /> }
    @case (2) { <app-autopay [user]="u" /> <app-budget-tips [user]="u" /> }
    @case (3) { <app-hardship-assistance [user]="u" /> <app-debt-counseling [user]="u" /> }
  }
}
```

The same flag also drives the honesty label shown to the user:
```html
<span class="pill" [class.pill--good]="entry.result.deterministic" ...>
  {{ entry.result.deterministic ? 'Standard response · same for all borrowers'
                                : 'Personalized for your account' }}
</span>
```

The [`dashboard.component.ts`](src/app/components/dashboard/dashboard.component.ts)
`ask()` method only classifies and records the result — it never decides which
components appear; the template rule above does.

#### Mechanism 3 — `authGuard`

The access half of the gate: nothing reaches the dashboard without an
authenticated user.

[`auth.guard.ts`](src/app/services/auth.guard.ts):
```ts
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  return router.createUrlTree(['/login']);
};
```
backed by the deterministic auth signal in
[`auth.service.ts`](src/app/services/auth.service.ts):
```ts
readonly isAuthenticated = computed(() => this._currentUser() !== null);
```

#### How the three add up to the gate

| Diagram element | Implemented by | Role |
|---|---|---|
| `InquiryResult.deterministic` | [`inquiry.model.ts`](src/app/models/inquiry.model.ts) + [`inquiry.service.ts`](src/app/services/inquiry.service.ts) | The gate's verdict — set once, at classification |
| Dashboard composition rule | [`dashboard.component.html`](src/app/components/dashboard/dashboard.component.html) | Enforces the verdict — decides which components render |
| `authGuard` | [`auth.guard.ts`](src/app/services/auth.guard.ts) + [`auth.service.ts`](src/app/services/auth.service.ts) | The access precondition |

> **Caveat:** in this POC the answer components (e.g. `NextPaymentComponent`) read
> figures straight off the `User` object rather than through the `/bll` services,
> and the `deterministic` flag is set by keyword rules rather than computed by a
> BLL engine. So the gate is demonstrated *structurally* (CLL proposes a category
> → the composition rule / authGuard control what the borrower sees) but isn't yet
> wired so that every number literally originates in the BLL seat.

### Design note: can AI decide whether an inquiry is deterministic?

Short answer: **use AI for the *classification*, but not for the `deterministic`
flag itself** — that's exactly the line the Determinism Gate protects.

#### Two different decisions are hiding in `classify()`

Today [`inquiry.service.ts`](src/app/services/inquiry.service.ts) does two things
at once, and they have very different governance requirements:

1. **"What is this inquiry about?"** — mapping free text → an `InquiryCategory`.
   This is *interpretation*, the textbook CLL job; the doc comment already says
   *"in a real system this would call an AI service."* ✅ **Fine for AI.**
2. **"Must this answer be identical/authoritative for every borrower?"** — the
   `deterministic` boolean. This is a *policy* about whether the gate injects
   AI/personalized content or forces a uniform, BLL-sourced answer.
   ❌ **Should not be an AI output.**

#### Why AI must not own the `deterministic` flag

That flag *is* the gate's verdict — the dashboard uses it to decide (a) whether to
add the per-user-type personalized cards and (b) which honesty label to show
("same for all borrowers" vs "personalized"). If the model sets it:

- A misclassification could route a **payment/balance** question into the
  *personalized* path, letting AI-authored cards attach to a consequential answer.
- The **"same for all borrowers" label could become false** — the UI would assert
  a reproducibility guarantee the model didn't actually enforce.
- You lose reproducibility/auditability on the one bit that governs the whole gate.
  "Is this consequential?" is precisely what must be deterministic — the AI
  deciding *when the gate applies to it* defeats the gate.

This is the invariant from
[`plus_architecture.md`](documentation/plus_architecture.md): *the CLL proposes,
the BLL disposes.* The category is a proposal; the flag is a disposition.

#### The pattern that keeps the gate intact

Let the AI produce the category; let a **fixed, code/config-owned lookup** derive
`deterministic` from it:

```ts
// Policy — owned by code/config, reproducible & auditable. NOT an AI output.
const DETERMINISTIC_CATEGORIES = new Set<InquiryCategory>([
  'NEXT_PAYMENT', 'LOAN_BALANCE', 'EXTRA_PAYMENT', 'PROFILE_UPDATE',
]);

classify(text: string): InquiryResult {
  const { category, confidence } = this.ai.classifyIntent(text); // CLL proposes
  // Low-confidence → don't guess a consequential category; fall back safely.
  const cat = confidence >= THRESHOLD ? category : 'GENERAL';
  return {
    category: cat,
    deterministic: DETERMINISTIC_CATEGORIES.has(cat), // policy disposes the flag
    label: LABELS[cat],
  };
}
```

Two more guardrails worth keeping:

- **Even for a deterministic category, the numbers still come from the BLL**, never
  the model (see the caveat above about answer components reading the `User` object
  directly — worth fixing before wiring in a real classifier).
- **On low confidence, abstain rather than guess** — route to `GENERAL` or a human
  hand-off, so a shaky AI guess can't silently mislabel a money question.

So: AI in `InquiryService` for **intent classification** — yes, that's its intended
role. AI deciding **whether the gate treats the answer as deterministic** — no; keep
that a deterministic mapping.
