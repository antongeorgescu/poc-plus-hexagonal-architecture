# Self-Service Loan Servicing — Hexagonal Architecture POC

An Angular 18 re-implementation of the same self-service loan-servicing POC as its
siblings (`../ntier_architecture`, `../clean_architecture`), re-expressed strictly
in **Alistair Cockburn's Hexagonal Architecture (Ports & Adapters)**.

The whole point of this POC is to make the **ports-and-adapters boundary** visible:
a **technology-agnostic application core** sits in the middle, and everything
outside plugs in through **ports** (interfaces) via **adapters**. There are two
**symmetric** sides:

- the **driving (primary)** side — adapters that *drive* the core (the UI, tests);
- the **driven (secondary)** side — adapters the core *drives* (CSV, the model
  runtime, KB, chat history).

The core holds **two regions**: the deterministic **BLL** (`core/application` +
`core/domain`) and the cognitive **CLL** (`core/cognitive`). Both are core because
both are application logic; the adapter ring holds **technology only** — the LLM
runtime included, behind `LanguageModelPort`.

> **The CLL proposes, the BLL disposes.** The cognitive region owns no
> authoritative computation and can reach one only by calling a **driving port** of
> the deterministic region — the same door the UI uses, with no privileged path.
> Delete `core/cognitive/` and its four driving ports and the deterministic
> hexagon still computes every balance, payment, and eligibility. Swap
> `MockLanguageModel` for a real LLM and no core file changes.

<sub>**Why not put the CLL in the adapter ring?** An adapter translates a
*technology* into a port. These services translate nothing — they hold policy: the
fixed determinism map, the topic labels, the sentiment bands, the rule that a
summary is exactly profile + loan + payment. Filing them as adapters put logic
where technology belongs and left the genuinely foreign thing — the model — with
no port at all.</sub>

## Layering (folders under `src/app/`)

```
src/app/
├── core/                         # THE HEXAGON — pure TypeScript, ZERO @angular
│   ├── domain/                   #   entities + ALL money math / rules
│   │   ├── user.entity.ts
│   │   ├── loan.entity.ts        #   paid %, months-to-maturity
│   │   ├── payment.entity.ts     #   snapshot, payoff, validation, references
│   │   ├── borrower.entity.ts    #   profile, standing, contact validation
│   │   ├── eligibility.entity.ts #   rate-relief decision + money math
│   │   ├── inquiry.ts            #   shared vocabulary (category enum, job posting)
│   │   └── sentiment.ts          #   shared vocabulary (sentiment label + tone)
│   ├── application/              # DETERMINISTIC region (BLL) — implements the BLL driving ports
│   │   ├── authenticate.service.ts   #   implements AuthenticatePort, needs UserRepositoryPort
│   │   ├── payment.service.ts        #   implements PaymentPort
│   │   ├── loan-info.service.ts      #   implements LoanInfoPort
│   │   ├── profile.service.ts        #   implements ProfilePort
│   │   └── eligibility.service.ts    #   implements EligibilityPort
│   └── cognitive/                # COGNITIVE region (CLL) — implements the CLL driving ports.
│       │                         #   Core logic, NOT an adapter: it holds policy, no technology.
│       │                         #   Reaches the BLL only through BLL driving ports; reaches the
│       │                         #   model only through LanguageModelPort.
│       ├── inquiry.service.ts         # owns the FIXED determinism map + topic labels
│       ├── personalization.service.ts # owns the theme policy
│       ├── chat-insights.service.ts   # owns the sentiment bands
│       └── account-summary.service.ts # owns the aggregation policy (profile+loan+payment)
│
├── ports/                        # THE BOUNDARY — pure TypeScript interfaces, ZERO @angular
│   ├── driving/                  #   inbound / primary ports — what the core EXPOSES
│   │   ├── authenticate.port.ts  #     AuthenticatePort      ─┐
│   │   ├── payment.port.ts       #     PaymentPort            │ deterministic
│   │   ├── loan-info.port.ts     #     LoanInfoPort           │ region
│   │   ├── profile.port.ts       #     ProfilePort            │
│   │   ├── eligibility.port.ts   #     EligibilityPort       ─┘
│   │   ├── inquiry.port.ts       #     InquiryPort           ─┐
│   │   ├── personalization.port.ts #   PersonalizationPort    │ cognitive region —
│   │   ├── chat-insights.port.ts  #    ChatInsightsPort       │ SAME edge, same kind
│   │   └── account-summary.port.ts #   AccountSummaryPort    ─┘ of door
│   └── driven/                   #   outbound / secondary ports — what the core REQUIRES
│       ├── user-repository.port.ts   #     UserRepositoryPort (BLL)
│       ├── language-model.port.ts    #     LanguageModelPort  (CLL) — the LLM behind a port
│       ├── knowledge-base.port.ts    #     KnowledgeBasePort  (CLL, read-only grounding)
│       └── chat-history.port.ts      #     ChatHistoryPort    (CLL, read-only grounding)
│
├── adapters/                     # TECHNOLOGY ONLY — no application logic lives here
│   ├── driving/                  # PRIMARY adapters — they DRIVE the core through driving ports
│   │   └── ui/                   #   Angular UI (login, dashboard, answer + summary cards)
│   └── driven/                   # SECONDARY adapters — the core DRIVES them through driven ports
│       ├── csv-user.repository.ts     # implements UserRepositoryPort (fetch assets/users.csv)
│       ├── mock-language-model.ts     # implements LanguageModelPort — keyword rules + templates
│       ├── azure-ai-language-model.ts # implements LanguageModelPort — REAL Azure OpenAI calls
│       ├── in-memory-knowledge-base.ts# implements KnowledgeBasePort
│       └── in-memory-chat-history.ts  # implements ChatHistoryPort
│
└── configuration/                # COMPOSITION ROOT (framework wiring; may import @angular)
    ├── tokens.ts                 #   InjectionTokens typed to the PORT interfaces
    ├── ai.config.ts              #   which model runtime + how to reach it (no secrets)
    ├── providers.ts              #   binds adapters↔driven ports, both core regions↔driving ports
    ├── session.store.ts          #   signal-based SessionStore
    └── auth.guard.ts             #   authGuard on /dashboard
```

## The ports-and-adapters boundary (how it is enforced)

The boundary is the **port** — an interface owned by the core. Every interaction
crosses a port via an adapter:

- **Primary adapters depend on DRIVING ports.** The UI injects driving-port
  *tokens* (`PAYMENT_PORT`, `LOAN_INFO_PORT`, `PROFILE_PORT`, `AUTHENTICATE_PORT`,
  and equally `INQUIRY_PORT`, `ACCOUNT_SUMMARY_PORT`, …) typed to the port
  *interfaces* — never a concrete core class. **The UI cannot tell a cognitive port
  from a deterministic one**; both are just doors in the same edge.
- **The cognitive region depends on the deterministic region's DRIVING ports.**
  `AccountSummaryService` names `ProfilePort` / `LoanInfoPort` / `PaymentPort` —
  the same interfaces the UI uses. This is the inner application of the same rule,
  and it is what keeps the CLL non-authoritative.
- **Both regions depend on DRIVEN ports for technology.** `AuthenticateService`
  names only `UserRepositoryPort`; `InquiryService` names only `LanguageModelPort`
  and `KnowledgeBasePort`. Nothing in `core/` names `users.csv`, Angular, or a model.
- **The composition root** (`configuration/providers.ts`) is the single place that
  knows the concrete classes: it (a) binds driven adapters to driven-port tokens,
  (b) constructs the deterministic services and binds them to their driving-port
  tokens, and (c) constructs the cognitive services — handing them deterministic
  driving ports plus `LANGUAGE_MODEL_PORT` — and binds them to theirs.

Three invariants keep the hexagon honest — verify them yourself:

```bash
# 1. core/ and ports/ contain ZERO Angular imports:
grep -RE "^import.*@angular" src/app/core src/app/ports    # → no matches

# 2. The cognitive region reaches the deterministic one only through PORTS —
#    it never imports a deterministic service directly:
grep -RE "from '\.\./application/" src/app/core/cognitive  # → no matches

# 3. A primary adapter depends on a driving-port INTERFACE, not a concrete class:
#   src/app/adapters/driving/ui/inquiry/make-payment.component.ts
#     import { PaymentPort } from '../../../../ports/driving/payment.port';
#     private paymentPort: PaymentPort = inject(PAYMENT_PORT);
```

## How the CLL / BLL split maps

Both are **regions of the one hexagon**. What separates them is not distance from
the center but *authority*: one computes, the other phrases.

- **BLL = the deterministic region.** All money math and rules live in
  `core/domain`, exposed as services in `core/application` behind the
  **deterministic driving ports**.
- **CLL = the cognitive region** (`core/cognitive`). It *proposes* (classifies free
  text, phrases greetings, narrates a summary, interprets tone) and is core logic
  because it owns **policy**. It obtains every authoritative value by calling a
  **deterministic driving port** — exactly like the UI — and never computes money or
  eligibility.
  - `InquiryService.classify` asks `LanguageModelPort` to *propose* a category, then
    stamps the `deterministic` flag from a **fixed policy map it owns**. A wrong
    proposal can pick the wrong topic; it cannot move a topic into or out of the
    deterministic set.
  - `AccountSummaryService` aggregates `ProfilePort` + `LoanInfoPort` +
    `PaymentPort` and delegates the *sentences* to `LanguageModelPort`.
  - `ChatInsightsService` owns the score bands; the model only writes the blurb.
- **The model is not the CLL.** It is a technology behind `LanguageModelPort`,
  implemented in this POC by `adapters/driven/mock-language-model.ts` (keyword
  rules + string templates, no AI call). Note what that adapter is *not* allowed to
  do: every number it prints arrives already computed.
- **Grounding crosses a port too** — jobs and chat history are served by driven
  adapters through `KnowledgeBasePort` / `ChatHistoryPort`, so even the model's
  context is mediated by an interface.

## How this differs from the Clean sibling

Same feature set, same domain logic — a different *shape of the boundary*:

| Aspect | Clean (`../clean_architecture`) | Hexagonal (this project) |
| --- | --- | --- |
| Boundary metaphor | concentric rings + the **Dependency Rule** (arrows point inward) | a **hexagon** with **ports** on every edge |
| Core structure | `domain` + `application/use-cases` (one class per use case) | `core/domain` + `core/application` (one service per driving port) + `core/cognitive` |
| The interface layer | `application/ports` (outbound only); inbound side is implicit (use-case classes are the entry) | an explicit, symmetric **`ports/` layer** with `driving/` **and** `driven/` sides |
| How the UI reaches the core | injects **use-case tokens** (typed to the concrete use-case class) | injects **driving-port tokens** (typed to the port *interface*) |
| Where the CLL sits | `adapters/cll` (a detail on the outer ring) | `core/cognitive` — **inside the hexagon**, behind its own driving ports |
| Where the model sits | inside the CLL adapter | `adapters/driven/mock-language-model.ts`, behind `LanguageModelPort` |
| One-line guarantee | *Dependency Rule* at compile time | *everything crosses a port* — including the CLL's calls into the BLL |

The N-Tier sibling expresses the same guarantee a third way, as a runtime
*Determinism Gate*.

## Feature scope (matches the Clean sibling exactly)

- Login with 6 demo accounts (one-click demo buttons); `authGuard` on `/dashboard`.
- Dashboard: themed welcome per user type; always-on two-card insights panel
  (Account Summary + Conversation Insights with a sentiment tone-meter); an "Ask"
  box routing free-text to answer components — `NEXT_PAYMENT`, `LOAN_BALANCE`,
  `EXTRA_PAYMENT` → make-payment, `PROFILE_UPDATE` → update-profile, else `GENERAL`.

### Omitted / simplified (identical to the Clean sibling)

- **No per-user-type personalized card matrix** (autopay / rewards / refinance /
  budget-tips / debt-counseling / hardship-assistance) — present in the N-Tier
  version, omitted here.
- **HARDSHIP / LIFE_EVENT answer UIs are present.** `JobOpportunitiesComponent`
  (hardship → matched job postings via `InquiryPort.getJobsForProgram` /
  `KnowledgeBasePort`) and `InterestReliefComponent` (life event → the rate-relief
  outcome decided by `EligibilityPort`). Both are personalized: the copy adapts to
  the borrower's standing tier, while every authoritative value still comes from
  the core.
- Knowledge base and chat history are **synthetic in-memory adapters**. The model
  behind `LanguageModelPort` defaults to `MockLanguageModel` — keyword matching and
  string templates, no real LLM call — but a **real Azure OpenAI adapter ships
  alongside it** (see below) and is selected by configuration alone.

## Connecting the CLL to Azure AI

`AzureAiLanguageModel` implements `LanguageModelPort` against Azure OpenAI Chat
Completions. It is an ordinary secondary adapter: the core never imports it and
`providers.ts` is the only file that knows it exists.

```bash
# PowerShell
$env:AZURE_OPENAI_ENDPOINT = 'https://<resource>.openai.azure.com'
$env:AZURE_OPENAI_API_KEY  = '<key>'
npm start
# then open http://localhost:4200/?ai=proxy   (…/?ai=mock to switch back)
```

To make Azure the default instead of a query-string opt-in, copy
`src/assets/ai-config.example.js` to `src/assets/ai-config.js`, set your
deployment name, and reference it from `src/index.html`. That file is
git-ignored.

### The key never reaches the browser

`ai.config.ts` has three modes:

| mode | where the model runs | credential |
| --- | --- | --- |
| `mock` *(default)* | in-process stub | none |
| `proxy` | Azure OpenAI via `proxy.conf.js` | held by the dev server; **never in the bundle** |
| `directKey` | Azure OpenAI straight from the browser | **exposed to anyone with devtools** — local spikes only |

In `proxy` mode the browser calls the same-origin path `/api/azure-ai`; the
Angular dev server rewrites it to your Azure endpoint and attaches `api-key`
server-side. `toAzureOptions()` blanks the key unless the mode is `directKey`, so
`proxy` cannot leak one by accident.

> ⚠️ **`proxy.conf.js` is dev-server only.** `ng build` emits static files with
> nothing in front of them. A deployed build needs a real server-side endpoint —
> an API route, APIM policy, or function — doing the same injection.

### What the adapter is not allowed to do

The CLL/BLL split survives the upgrade, and the adapter is where that is enforced:

- **It never computes an authoritative value.** Every figure in a prompt arrives
  already computed from the deterministic region; the system prompts forbid
  inventing, recomputing or re-rounding any number, date, rate or amount.
- **It never decides what a category means.** `classifyInquiry` proposes one of
  the seven fixed labels or `null`. An unrecognised or unparseable answer becomes
  `null` — "no opinion" — which `InquiryService` already collapses to `GENERAL`.
  The determinism policy stays in the core.
- **It never fails the user.** Any timeout, non-2xx, transport error, content
  filter or malformed payload delegates to the injected `MockLanguageModel`. The
  POC therefore behaves identically with no credentials, no network, or a cold
  Azure resource — you get templated copy instead of generated copy.

### The one thing that had to change inside the hexagon

`LanguageModelPort` was **synchronous**, which quietly assumed the adapter behind
it was in-process. No remote model can satisfy that shape, so the port — and the
four cognitive driving ports in front of it — now return `Promise`s.

This is worth noting honestly: the README used to claim that swapping the model
was a one-line composition-root change, and the first real swap disproved it. The
port had leaked an assumption about its adapter. Now that the contract is shaped
by the *slowest plausible* adapter, the claim is true — mock and Azure are
genuinely interchangeable, and a third runtime would cost one line.

## Run it

```bash
cd POC/hexagonal_architecture
npm install
npm run build        # production build → dist/hexagonal-architecture-loan-poc
npm start            # dev server at http://localhost:4200
```

All six demo accounts use the password **demo123**.
