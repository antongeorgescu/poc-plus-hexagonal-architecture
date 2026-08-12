# Ports Reference — Hexagonal Loan Servicing POC

The interface reference for this application's core. It plays the role a Swagger
page plays for an HTTP service: **every way to interact with the core, what you
pass, and what you get back.**

There is no HTTP API here — the app is a browser bundle. But in Ports & Adapters
the **port *is* the API**, and it is a stricter one than a URL: it is a typed
interface the compiler enforces. Everything below is generated from the real
interfaces under [`src/app/ports/`](src/app/ports).

Two sides, and the direction matters:

| Side | Meaning | Who implements it |
|---|---|---|
| **Driving** (inbound, primary) | Operations the core **offers**. What a driver calls to make the app do something. | the core |
| **Driven** (outbound, secondary) | Capabilities the core **requires**. What the core calls to reach the outside world. | adapters |

---

## Calling a driving port

Inject the **token**, typed to the **interface**. Never import a concrete service
— that is the one rule that keeps the core swappable.

```ts
import { inject } from '@angular/core';
import { PaymentPort } from '../ports/driving/payment.port';
import { PAYMENT_PORT } from '../configuration/tokens';

class SomeComponent {
  private payments: PaymentPort = inject(PAYMENT_PORT);   // interface, not class

  ngOnInit() {
    const snapshot = this.payments.getSnapshot(this.user); // authoritative figures
  }
}
```

All bindings live in one file, [`configuration/providers.ts`](src/app/configuration/providers.ts)
— the composition root. It is the only place that names a concrete class.

## Conventions that hold across every port

**Async means "may leave the process."** Anything that touches the language model,
the network, or a stored asset returns a `Promise`; pure in-core computation is
synchronous. The async signature is declared on the *port*, not discovered per
adapter, so a remote implementation never forces a change inside the hexagon.

That is why all three data-backed driven ports — `UserRepositoryPort`,
`KnowledgeBasePort`, `ChatHistoryPort` — are async even though their adapters
merely `fetch()` a CSV from `assets/`. The asynchrony is about *where the data
lives*, not about whether a model is involved; only `LanguageModelPort` is async
for the model reason.

**No port throws for an expected outcome.** Failures are values:

| Pattern | Used for | Example |
|---|---|---|
| `null` return | "not found" / "no opinion" | `AuthenticatePort.execute` → `null` on bad credentials |
| Result object with `success` | an attempted write | `PaymentResult`, `ProfileUpdateResult` |
| Outcome object with `reason` | a decision that can go either way | `RateReliefOutcome` |

**Authority.** Ports marked **BLL** produce authoritative values — money,
eligibility, identity. Ports marked **CLL** interpret, narrate and personalise;
they never compute an authoritative value, and they obtain one only by calling a
BLL driving port themselves. For the mechanism in detail see
[`references/project_swagger.md`](references/project_swagger.md); to watch it happen
on one request, [`references/inquiry_scenario_end_to_end.md`](references/inquiry_scenario_end_to_end.md).

---

# Driving ports — what the core offers

| Port | Region | Token | Implementation |
|---|---|---|---|
| [AuthenticatePort](#authenticateport) | BLL | `AUTHENTICATE_PORT` | `AuthenticateService` |
| [LoanInfoPort](#loaninfoport) | BLL | `LOAN_INFO_PORT` | `LoanInfoService` |
| [PaymentPort](#paymentport) | BLL | `PAYMENT_PORT` | `PaymentService` |
| [ProfilePort](#profileport) | BLL | `PROFILE_PORT` | `ProfileService` |
| [EligibilityPort](#eligibilityport) | BLL | `ELIGIBILITY_PORT` | `EligibilityService` |
| [InquiryPort](#inquiryport) | **CLL** | `INQUIRY_PORT` | `InquiryService` |
| [AccountSummaryPort](#accountsummaryport) | **CLL** | `ACCOUNT_SUMMARY_PORT` | `AccountSummaryService` |
| [ChatInsightsPort](#chatinsightsport) | **CLL** | `CHAT_INSIGHTS_PORT` | `ChatInsightsService` |
| [PersonalizationPort](#personalizationport) | **CLL** | `PERSONALIZATION_PORT` | `PersonalizationService` |

## AuthenticatePort

Identity. The only port callable before a `User` exists.

| Operation | Returns | Notes |
|---|---|---|
| `execute(username: string, password: string)` | `Promise<User \| null>` | `null` = rejected. Async because the CSV repository is fetched. |

## LoanInfoPort

| Operation | Returns | Notes |
|---|---|---|
| `getLoanInfo(user: User)` | [`LoanInfo`](#loaninfo) | Synchronous. All money math done in the domain. |

## PaymentPort

| Operation | Returns | Notes |
|---|---|---|
| `getSnapshot(user: User)` | [`PaymentSnapshot`](#paymentsnapshot) | Position: due amounts, arrears, streak. |
| `submit(user: User, request: `[`PaymentRequest`](#paymentrequest)`)` | [`PaymentResult`](#paymentresult) | **Authoritative write.** Validates, computes, issues a reference number. |
| `suggestedAmount(user: User)` | `number` | A one-off lump-sum suggestion (10% of balance), **not** a monthly figure. |
| `fundingSources()` | `string[]` | Selectable sources. Takes no user. |

## ProfilePort

| Operation | Returns | Notes |
|---|---|---|
| `getProfile(user: User)` | [`BorrowerProfile`](#borrowerprofile) | Includes rule-derived account standing. |
| `getContact(user: User)` | [`ProfileContact`](#profilecontact) | Current details, for pre-filling a form. |
| `updateProfile(user: User, contact: `[`ProfileContact`](#profilecontact)`)` | [`ProfileUpdateResult`](#profileupdateresult) | Validates email/phone; returns a reference on success. |

## EligibilityPort

| Operation | Returns | Notes |
|---|---|---|
| `checkRateRelief(user: User)` | [`RateReliefOutcome`](#ratereliefoutcome) | **The decision is made here, never by the CLL.** The CLL may only phrase `reason`. |

## InquiryPort

*CLL.* Turns free text into a topic, and stamps the fixed determinism policy onto
the result.

| Operation | Returns | Notes |
|---|---|---|
| `classify(text: string)` | `Promise<`[`InquiryResult`](#inquiryresult)`>` | Async: the model may be remote. An unusable proposal collapses to `GENERAL`. |
| `getJobsForProgram(user: User)` | `Promise<`[`JobPosting[]`](#jobposting)`>` | Read-only grounding. Async because the catalog is a stored CSV — **not** because a model is involved. |

> `InquiryResult.deterministic` comes from a **fixed policy map in the core**, not
> from the model. A wrong proposal can pick the wrong topic; it cannot move a
> topic across the deterministic line.

## AccountSummaryPort

*CLL.* Aggregates three BLL ports and narrates the result.

| Operation | Returns | Notes |
|---|---|---|
| `summarize(user: User)` | `Promise<`[`AccountSummary`](#accountsummary)`>` | Returns the authoritative objects **and** the prose, so the UI renders figures from the BLL side. |

## ChatInsightsPort

*CLL.* Interprets a raw tone signal into a band, then asks for supportive copy.

| Operation | Returns | Notes |
|---|---|---|
| `getInsights(user: User)` | `Promise<`[`ChatInsights`](#chatinsights)`>` | The sentiment reading is a **UI signal only** — nothing deterministic reads it. |

## PersonalizationPort

*CLL.* Welcome copy plus the theme policy.

| Operation | Returns | Notes |
|---|---|---|
| `getWelcome(user: User)` | `Promise<`[`WelcomeContent`](#welcomecontent)`>` | Copy is model output; `themeClass` is business policy set in the core. |

---

# Driven ports — what the core requires

Implement these to run the core against different technology. Bind in
`providers.ts`; nothing in `core/` changes.

| Port | Token | Ships with |
|---|---|---|
| [UserRepositoryPort](#userrepositoryport) | `USER_REPOSITORY_PORT` | `CsvUserRepository` — fetches `assets/users.csv` |
| [LanguageModelPort](#languagemodelport) | `LANGUAGE_MODEL_PORT` | `MockLanguageModel` *(default)* or `AzureAiLanguageModel` |
| [KnowledgeBasePort](#knowledgebaseport) | `KNOWLEDGE_BASE_PORT` | `CsvKnowledgeBase` — fetches `assets/jobs.csv` |
| [ChatHistoryPort](#chathistoryport) | `CHAT_HISTORY_PORT` | `CsvChatHistory` — fetches `assets/chat-summary.csv` |

## UserRepositoryPort

The system of record. **Read-only by design** — the app cannot write borrower data.

| Operation | Returns |
|---|---|
| `getUsers()` | `Promise<User[]>` |
| `findByCredentials(username: string, password: string)` | `Promise<User \| null>` |

## LanguageModelPort

The model runtime. **Every method returns prose, an enum, or `null` — never a
number.** That signature is what makes it impossible to ask the model for an
authoritative value.

| Operation | Returns | Purpose |
|---|---|---|
| `classifyInquiry(text: string, candidates: readonly `[`CategoryDescriptor`](#categorydescriptor)`[])` | `Promise<`[`InquiryCategory`](#enumerations)` \| null>` | Propose a topic by matching the wording against each description. `null` = abstain. |
| `narrateLoan(profile: `[`BorrowerProfile`](#borrowerprofile)`, loan: `[`LoanInfo`](#loaninfo)`)` | `Promise<string>` | Phrase an already-computed fact set. |
| `narratePayments(payment: `[`PaymentSnapshot`](#paymentsnapshot)`)` | `Promise<string>` | Phrase an already-computed snapshot. |
| `describeTone(label: `[`SentimentLabel`](#enumerations)`)` | `Promise<string>` | One supportive sentence for a band already chosen. |
| `composeWelcome(user: User)` | `Promise<`[`WelcomeCopy`](#welcomecopy)`>` | Greeting, invitation, 3 suggested prompts. |

Note the shape of every signature: **computed values in, words out.** The
candidate descriptions are supplied by the core, so the adapter holds no copy of
the taxonomy.

## KnowledgeBasePort

| Operation | Returns | Notes |
|---|---|---|
| `getJobsForProgram(program: string, location: string)` | `Promise<`[`JobPosting[]`](#jobposting)`>` | Grounding source (`assets/jobs.csv`). `location` only ranks the matches nearest-first. Never a system of record. |

## ChatHistoryPort

| Operation | Returns | Notes |
|---|---|---|
| `getHistory(user: User)` | `Promise<`[`ChatHistoryRecord`](#chathistoryrecord)`>` | Grounding source (`assets/chat-summary.csv`, one row per borrower). Returns a **raw** `toneScore`; the CLL interprets it. |

---

# Schemas

### User

The input to nearly every operation. One row of `assets/users.csv`.

```ts
{
  username: string;  password: string;  firstName: string;  lastName: string;
  userType: UserType;                 // 1 | 2 | 3
  programOfStudy: string;  city: string;  province: string;
  originalAmount: number;  currentBalance: number;  interestRate: number;
  monthlyPayment: number;  nextPaymentDate: string;  nextPaymentAmount: number;
  maturityDate: string;               // ISO yyyy-mm-dd
  paymentsMade: number;  paymentsMissed: number;  onTimeStreak: number;
  creditScore: number;
}
```

### LoanInfo

```ts
{
  originalAmount: number;  currentBalance: number;  interestRate: number;
  maturityDate: string;    paidPercent: number;     monthsToMaturity: number;
}
```

### PaymentSnapshot

```ts
{
  monthlyPayment: number;      nextPaymentAmount: number;  nextPaymentDate: string;
  paymentsMade: number;        paymentsMissed: number;     onTimeStreak: number;
  isPastDue: boolean;          pastDueAmount: number;      suggestedExtraPayment: number;
}
```

### PaymentRequest

```ts
{
  amount: number;
  fundingSource: string;
  effectiveDate: string;                        // ISO yyyy-mm-dd
  applyTo: 'PRINCIPAL' | 'NEXT_INSTALLMENT';
}
```

### PaymentResult

```ts
{
  success: boolean;            message: string;
  referenceNumber?: string;    amount?: number;
  projectedBalance?: number;   effectiveDate?: string;
}
```

### BorrowerProfile

```ts
{
  firstName: string;  lastName: string;  fullName: string;
  programOfStudy: string;  city: string;  province: string;  location: string;
  creditScore: number;  userType: UserType;
  standingLabel: string;                        // rule-derived
  standingTone: 'good' | 'warn' | 'bad';
  standingSummary: string;                      // rule-derived PROSE — owned by the BLL
}
```

> `standingSummary` is human copy that lives in the **domain**, not the CLL,
> because it asserts something the business is accountable for. Contrast
> `describeTone()`, which is decorative and therefore model output.

### ProfileContact

```ts
{ email: string; phone: string; mailingAddress: string }
```

### ProfileUpdateResult

```ts
{ success: boolean; message: string;
  referenceNumber?: string; updated?: ProfileContact }
```

### RateReliefOutcome

```ts
{
  eligible: boolean;                 // the DECISION — made in the domain
  proposedRate: number;
  estimatedMonthlySavings: number;
  reason: string;                    // printed verbatim by the UI
}
```

### InquiryResult

```ts
{
  category: InquiryCategory;
  deterministic: boolean;   // from the fixed policy map, never the model
  label: string;            // business-owned display label
}
```

### AccountSummary

```ts
{
  profile: BorrowerProfile;   // authoritative
  loan: LoanInfo;             // authoritative
  payment: PaymentSnapshot;   // authoritative
  loanSentence: string;       // narration
  paymentsSentence: string;   // narration
}
```

### ChatInsights

```ts
{ summary: string | null;  sentiment: ChatSentiment;
  liveChatSessions: number;  chatbotMessages: number;  lastContact: string }
```

### ChatSentiment

```ts
{ score: number;              // 0..100 raw signal
  label: SentimentLabel;      // band chosen in the core
  emoji: string;
  tone: SentimentTone;
  blurb: string }             // model output
```

### WelcomeCopy

```ts
{ greeting: string; question: string; suggestions: string[] }
```

### WelcomeContent

```ts
WelcomeCopy + { themeClass: string }    // themeClass added in the core, not by the model
```

### ChatHistoryRecord

```ts
{
  liveChatSessions: number;  chatbotMessages: number;  lastContact: string;
  summary: string | null;    toneScore: number;        // RAW — uninterpreted
}
```

### JobPosting

```ts
{ title: string; company: string; location: string; salary: string; type: string }
```

### CategoryDescriptor

```ts
{ category: InquiryCategory; description: string }   // description = the matching signal
```

---

# Enumerations

| Type | Values |
|---|---|
| `UserType` | `1` Excellent standing · `2` Delinquency grade 1 · `3` Delinquency grade 2 |
| `InquiryCategory` | `NEXT_PAYMENT` · `LOAN_BALANCE` · `EXTRA_PAYMENT` · `PROFILE_UPDATE` · `HARDSHIP` · `LIFE_EVENT` · `REPAYMENT_OPTIONS` · `GENERAL` |
| `PaymentApplyTo` | `PRINCIPAL` · `NEXT_INSTALLMENT` |
| `SentimentLabel` | `Very positive` · `Positive` · `Neutral` · `Negative` · `Very negative` |
| `SentimentTone` | `good` · `warn` · `bad` |

### Determinism policy

Which topics are answered identically for every borrower. Owned by the business;
the model never sees this map.

| Category | `deterministic` |
|---|---|
| `NEXT_PAYMENT` · `LOAN_BALANCE` · `EXTRA_PAYMENT` · `PROFILE_UPDATE` | `true` |
| `HARDSHIP` · `LIFE_EVENT` · `REPAYMENT_OPTIONS` · `GENERAL` | `false` |

`GENERAL` is never offered to the classifier — it is the absence of a match, and
the core substitutes it when the model abstains.

---

## Adding a port

1. Declare the interface in `ports/driving/` or `ports/driven/`.
2. Add an `InjectionToken` typed to the **interface** in `configuration/tokens.ts`.
3. Implement it — in `core/` for a driving port, in `adapters/driven/` for a
   driven one.
4. Bind it in `configuration/providers.ts`.

Nothing else in the application needs to know. That is the property this
reference exists to document.
