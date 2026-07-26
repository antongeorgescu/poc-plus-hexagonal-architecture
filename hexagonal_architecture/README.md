# Self-Service Loan Servicing — Hexagonal Architecture POC

An Angular 18 re-implementation of the same self-service loan-servicing POC as its
siblings (`../ntier_architecture`, `../clean_architecture`), re-expressed strictly
in **Alistair Cockburn's Hexagonal Architecture (Ports & Adapters)**.

The whole point of this POC is to make the **ports-and-adapters boundary** visible:
a **technology-agnostic application core** sits in the middle, and everything
outside plugs in through **ports** (interfaces) via **adapters**. There are two
**symmetric** sides:

- the **driving (primary)** side — adapters that *drive* the core (UI, CLL, tests);
- the **driven (secondary)** side — adapters the core *drives* (CSV, KB, chat history).

> **The CLL proposes, the core disposes.** The cognitive CLL is *just another
> primary adapter* — no more privileged than the UI. It can invoke an
> authoritative operation through a driving port, but it can never *become* one.
> Unplug the CLL entirely and the UI still drives the same ports and the core
> still computes every balance, payment, and eligibility.

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
│   │   └── inquiry.ts            #   shared vocabulary (category enum, job posting)
│   └── application/              #   application services (use-case implementations)
│       ├── authenticate.service.ts   #   implements AuthenticatePort, needs UserRepositoryPort
│       ├── payment.service.ts        #   implements PaymentPort
│       ├── loan-info.service.ts      #   implements LoanInfoPort
│       ├── profile.service.ts        #   implements ProfilePort
│       └── eligibility.service.ts    #   implements EligibilityPort
│
├── ports/                        # THE BOUNDARY — pure TypeScript interfaces, ZERO @angular
│   ├── driving/                  #   inbound / primary ports — what the core EXPOSES
│   │   ├── authenticate.port.ts  #     AuthenticatePort
│   │   ├── payment.port.ts       #     PaymentPort
│   │   ├── loan-info.port.ts     #     LoanInfoPort
│   │   ├── profile.port.ts       #     ProfilePort
│   │   └── eligibility.port.ts   #     EligibilityPort
│   └── driven/                   #   outbound / secondary ports — what the core REQUIRES
│       ├── user-repository.port.ts   #     UserRepositoryPort
│       ├── knowledge-base.port.ts    #     KnowledgeBasePort
│       └── chat-history.port.ts      #     ChatHistoryPort
│
├── adapters/
│   ├── driving/                  # PRIMARY adapters — they DRIVE the core through driving ports
│   │   ├── ui/                   #   Angular UI (login, dashboard, answer + summary cards)
│   │   └── cll/                  #   the Cognitive Logic Layer — another primary adapter
│   │       ├── inquiry.service.ts         # classify + propose; deterministic flag from a FIXED map
│   │       ├── personalization.service.ts # greeting/theme phrasing
│   │       ├── chat-insights.service.ts   # interprets ChatHistoryPort (grounding) into sentiment
│   │       └── account-summary.service.ts # narrates via ProfilePort + LoanInfoPort + PaymentPort
│   └── driven/                   # SECONDARY adapters — the core DRIVES them through driven ports
│       ├── csv-user.repository.ts     # implements UserRepositoryPort (fetch assets/users.csv)
│       ├── in-memory-knowledge-base.ts# implements KnowledgeBasePort
│       └── in-memory-chat-history.ts  # implements ChatHistoryPort
│
└── configuration/                # COMPOSITION ROOT (framework wiring; may import @angular)
    ├── tokens.ts                 #   InjectionTokens typed to the PORT interfaces
    ├── providers.ts              #   binds adapters↔driven ports, app services↔driving ports
    ├── session.store.ts          #   signal-based SessionStore
    └── auth.guard.ts             #   authGuard on /dashboard
```

## The ports-and-adapters boundary (how it is enforced)

The boundary is the **port** — an interface owned by the core. Every interaction
crosses a port via an adapter:

- **Primary adapters depend on DRIVING ports.** The UI answer components inject
  driving-port *tokens* (`PAYMENT_PORT`, `LOAN_INFO_PORT`, `PROFILE_PORT`,
  `AUTHENTICATE_PORT`) typed to the port *interfaces* — never a concrete
  application class. The CLL enters through the *same* driving ports as the UI.
- **The core depends on DRIVEN ports.** `AuthenticateService` names only
  `UserRepositoryPort`; the domain never names `users.csv` or an LLM.
- **The composition root** (`configuration/providers.ts`) is the single place
  that knows the concrete classes: it (a) binds driven adapters to driven-port
  tokens, (b) constructs application services (injecting driven ports) and binds
  them to driving-port tokens, and (c) binds the CLL primary adapters, which
  resolve the same driving ports.

Two invariants keep the hexagon honest — verify them yourself:

```bash
# core/ and ports/ contain ZERO Angular imports:
grep -R "@angular" src/app/core src/app/ports    # → no matches

# A primary adapter depends on a driving-port INTERFACE, not a concrete class:
#   src/app/adapters/driving/ui/inquiry/make-payment.component.ts
#     import { PaymentPort } from '../../../../ports/driving/payment.port';
#     private paymentPort: PaymentPort = inject(PAYMENT_PORT);
```

## How the CLL / BLL split maps

- **BLL = the hexagon.** All deterministic money math and rules live in
  `core/domain`, exposed as application services in `core/application` behind the
  **driving ports**.
- **CLL = a primary adapter** (`adapters/driving/cll`). It *proposes* (classifies
  free text, phrases greetings, narrates a summary, interprets tone) but obtains
  every authoritative value by calling a **driving port** — exactly like the UI.
  It never computes money or eligibility.
  - `InquiryService.classify` sets the `deterministic` flag from a **fixed policy
    map**, not from AI.
  - `AccountSummaryService` narrates by calling `ProfilePort` + `LoanInfoPort` +
    `PaymentPort`.
  - Read-only grounding (jobs, chat history) is served by **driven adapters**
    through `KnowledgeBasePort` / `ChatHistoryPort`, so even the AI's context is
    mediated by a port.

## How this differs from the Clean sibling

Same feature set, same domain logic — a different *shape of the boundary*:

| Aspect | Clean (`../clean_architecture`) | Hexagonal (this project) |
| --- | --- | --- |
| Boundary metaphor | concentric rings + the **Dependency Rule** (arrows point inward) | a **hexagon** with **ports** on every edge |
| Core structure | `domain` + `application/use-cases` (one class per use case) | `core/domain` + `core/application` (one service per driving port) |
| The interface layer | `application/ports` (outbound only); inbound side is implicit (use-case classes are the entry) | an explicit, symmetric **`ports/` layer** with `driving/` **and** `driven/` sides |
| How the UI reaches the core | injects **use-case tokens** (typed to the concrete use-case class) | injects **driving-port tokens** (typed to the port *interface*) |
| Where the CLL sits | `adapters/cll` (a detail on the outer ring) | `adapters/driving/cll` (a **primary adapter**, peer of the UI) |
| One-line guarantee | *Dependency Rule* at compile time | *everything crosses a port* — symmetric & swappable |

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
- **No HARDSHIP / LIFE_EVENT answer UIs.** The classifier still recognizes both
  categories and the **core keeps eligibility + jobs fully wired**
  (`EligibilityPort` / `EligibilityService`, `InquiryService.getJobsForProgram`
  via `KnowledgeBasePort`) — there is simply no screen that renders them, so the
  free-text routing falls through to `GENERAL` for those topics.
- Knowledge base and chat history are **synthetic in-memory adapters** (no real
  DB, no real LLM call).

## Run it

```bash
cd POC/hexagonal_architecture
npm install
npm run build        # production build → dist/hexagonal-architecture-loan-poc
npm start            # dev server at http://localhost:4200
```

All six demo accounts use the password **demo123**.
