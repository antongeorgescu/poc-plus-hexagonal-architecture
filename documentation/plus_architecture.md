# The "Plus" Architecture — Aggregating BLL and CLL

This note treats the **Business Logic Layer (BLL)** and the **Cognitive Logic Layer (CLL)** as two reusable **building blocks** and shows how two mainstream architectural styles — **N-Tier** and **Clean** — each become a *"Plus"* variant by **aggregating a CLL alongside the deterministic BLL**.

The blocks come straight from the companion files:

* **BLL** — deterministic, reproducible, auditable decisions. See [bll_use_cases.md](bll_use_cases.md) (referenced below as **BLL-*n***).
* **CLL** — cognitive: summarize, predict, explain, prioritize, personalize. See [cll_use_cases.md](cll_use_cases.md) (referenced as **CLL-*n***).

> **The invariant that must hold in *both* architectures:** *the CLL proposes; the BLL disposes.* Every number that touches money, every gate that touches access, and every regulatory determination is produced by the BLL. The CLL is grounded before it reasons and gated before its output reaches the user. The styles differ only in **where** the CLL is placed and **how** the boundary is enforced — never in **whether** it holds.

***

## The two building blocks

```mermaid
flowchart LR
  subgraph sgCLL["CLL — Cognitive Logic Layer · proposes"]
    C1["Summarize / Explain<br/>CLL-1 · CLL-9 · CLL-13 · CLL-18"]
    C2["Predict / Detect<br/>CLL-8 · CLL-11 · CLL-17"]
    C3["Recommend / Prioritize<br/>CLL-5 · CLL-12"]
    C4["Personalize UI<br/>CLL-15"]
  end
  subgraph sgBLL["BLL — Business Logic Layer · decides"]
    B1["Money math<br/>BLL-5 · BLL-7 · BLL-13 · BLL-15"]
    B2["Eligibility / Entitlement<br/>BLL-1 · BLL-25"]
    B3["Status &amp; Counters<br/>BLL-19 · BLL-20"]
    B4["Compliance / Disclosure<br/>BLL-27 · BLL-29 · BLL-31"]
  end
  sgCLL -->|"requests grounded facts &amp; decisions"| sgBLL
  sgBLL -->|"returns authoritative truth"| sgCLL
```

**Contract between the blocks.** The BLL exposes a set of pure, versioned operations (e.g., `amortize(balance, rate, term)`, `determineEligibility(profile)`, `qualifyingPaymentCount(loanId)`). The CLL may *call* these operations and *phrase* their results, but may never *substitute* for them. This single contract is what both architectures below preserve.

***

# Architecture 1 — N-Tier *Plus*

## Technical description

Classic N-Tier is strictly **horizontal**: Presentation → Logic → Data, each tier depending only on the one beneath it. The *Plus* variant keeps that shape and adds the **CLL as a peer of the BLL inside the logic tier**, with an explicit **Determinism Gate** between them.

* **Presentation tier** — web/mobile/agent console. Sends borrower/agent intent to the logic tier; renders whatever the gate returns.
* **Logic tier (Plus)** — two collaborating components:
  * **CLL** handles interpretation, grounding (retrieval), recommendation, and narration.
  * **BLL** owns all decisions and calculations.
  * **Determinism Gate** — the CLL cannot return a consequential result to Presentation without it being produced or authorized by the BLL. The gate is where the invariant is *mechanically* enforced.
* **Data tier** — system of record (authoritative, read-write for the BLL; read-only "grounding" for the CLL) plus an approved knowledge base for RAG.

```mermaid
flowchart TB
  U["Borrower / Agent"]
  subgraph P["Presentation Tier"]
    UI["Web · Mobile · Agent Console"]
  end
  subgraph L["Logic Tier — Plus"]
    direction LR
    CLL["CLL<br/>summarize · predict · recommend · personalize"]
    GATE{"Determinism<br/>Gate"}
    BLL["BLL<br/>eligibility · money math · compliance"]
    CLL -->|"proposals"| GATE
    GATE -->|"authorize / compute"| BLL
    BLL -->|"authoritative results"| GATE
  end
  subgraph D["Data Tier"]
    DB[("System of Record")]
    KB[("Approved Knowledge Base")]
  end
  U --> UI --> CLL
  GATE -->|"gated response"| UI --> U
  CLL -.->|"read-only grounding"| DB
  CLL -.->|"retrieve"| KB
  BLL -->|"read / write"| DB
```

## Proof — trace a core case through the tiers

**Case:** *"What happens if I increase payments by $50?"* — **CLL-10** (present scenarios) composed with **BLL-13** (amortization) and **BLL-5** (accrual).

```mermaid
sequenceDiagram
  actor B as Borrower
  participant UI as Presentation
  participant CLL as CLL
  participant GATE as Determinism Gate
  participant BLL as BLL
  participant DB as System of Record
  B->>UI: What if I pay +$50 per month?
  UI->>CLL: intent + account context
  CLL->>DB: read grounded facts (balance, rate)
  CLL->>GATE: propose scenarios [+$50, +$100]
  GATE->>BLL: amortize(balance, rate, term, delta)
  BLL->>DB: read authoritative principal and rate
  BLL-->>GATE: +$50 => -14 months, -$1,140 interest (exact)
  GATE-->>CLL: authoritative figures
  CLL-->>UI: narrated comparison, no invented numbers
  UI-->>B: plain-language explanation + BLL figures
  Note over CLL,BLL: CLL chooses WHICH scenarios — BLL owns the NUMBERS
```

The borrower experiences a conversational feature (CLL-10), but every dollar and month originates in BLL-13/BLL-5. Swap the model tomorrow and the figures are unchanged — that is the gate doing its job.

## Strengths / trade-offs

* ✅ **Low friction to adopt** — the CLL slots into an existing tier; teams keep their layering mental model.
* ✅ **Obvious enforcement point** — the gate is a single, testable seam.
* ⚠️ **Coupling risk** — because tiers know their neighbors concretely, a sloppy CLL can reach around the gate straight into Data or grow chatty with the BLL. Discipline is procedural, not structural.
* ⚠️ **The BLL is not intrinsically isolated** from infrastructure; it lives in the same tier as the CLL and often shares data access.

***

# Architecture 2 — Clean *Plus*

## Technical description

Clean Architecture is **concentric**, governed by the **Dependency Rule**: source-code dependencies point **inward only**. The center is pure domain; the outer rings are replaceable details.

The *Plus* insight is that **the BLL *is* the inner core** (Entities + Use Cases) and **the CLL is just another outer-ring detail** — a plug-in adapter, exactly like the database or the UI.

* **Entities (core)** — `Loan`, `Ledger`, `Payment`; invariants and money math (BLL-5, BLL-6).
* **Use Cases / Interactors (application)** — deterministic orchestration: `Amortize`/`CalculatePayoff` (BLL-7, BLL-13), `DetermineEligibility` (BLL-1, BLL-25), `CountQualifyingPayments` (BLL-20). These define **ports** (interfaces).
* **Interface Adapters** — controllers, presenters, repositories… **and the CLL adapter**, which *consumes* the use-case ports and *provides* an insight/presentation port (CLL-9, CLL-10, CLL-15).
* **Frameworks & Drivers (outer)** — UI, DB, and the **LLM runtime + vector store** as swappable infrastructure.

Because the CLL sits in the outer rings, **the core cannot depend on it**. The AI becomes non-load-bearing by construction: the determinism boundary is enforced by the *compiler and the dependency direction*, not by a runtime gate you must remember to call.

```mermaid
flowchart TB
  subgraph OUTER["Frameworks &amp; Drivers · outer"]
    UIU["UI / API"]
    LLM["LLM Runtime / Vector Store"]
    DBX["DB / External Services"]
  end
  subgraph ADAPT["Interface Adapters"]
    CTRL["Controllers / Presenters"]
    CLLA["CLL Adapter<br/>insight · orchestration<br/>CLL-9 · CLL-10 · CLL-15"]
    REPO["Repositories / Gateways"]
  end
  subgraph APP["Application · Use Cases — deterministic"]
    UC1["Amortize / CalculatePayoff<br/>BLL-7 · BLL-13"]
    UC2["DetermineEligibility<br/>BLL-1 · BLL-25"]
    UC3["CountQualifyingPayments<br/>BLL-20"]
  end
  subgraph DOM["Entities · Domain Core"]
    E1["Loan · Ledger · Payment<br/>invariants &amp; money math<br/>BLL-5 · BLL-6"]
  end
  UIU --> CTRL
  LLM --> CLLA
  DBX --> REPO
  CTRL --> UC1
  CLLA --> UC1
  CLLA --> UC2
  CLLA --> UC3
  REPO --> UC2
  UC1 --> E1
  UC2 --> E1
  UC3 --> E1
```

> **Dependency Rule in action:** every arrow points inward. The **CLL Adapter depends on the use-case ports**, never the reverse. The domain core has *no knowledge that an AI exists* — you could delete the CLL adapter and the platform still computes every balance, payment, and eligibility correctly.

## Proof — same case, contrasted placement

**Case:** *"What happens if I increase payments by $50?"* — again **CLL-10** + **BLL-13**, now expressed as an outer adapter calling an inner port.

```mermaid
sequenceDiagram
  actor B as Borrower
  participant UIA as UI Adapter
  participant CLLA as CLL Adapter (outer)
  participant UC as Amortize Use Case (core port)
  participant E as Loan / Ledger Entities
  B->>UIA: What if I pay +$50 per month?
  UIA->>CLLA: request insight
  CLLA->>UC: amortize(loanId, delta = +50)
  UC->>E: apply invariants, compute schedule
  E-->>UC: exact schedule (-14 months, -$1,140)
  UC-->>CLLA: authoritative result via port
  CLLA-->>UIA: narrated comparison (adapter formats only)
  UIA-->>B: explanation + core figures
  Note over CLLA,UC: The adapter cannot compute money — it may only call the port and phrase the result
```

Identical guarantee as N-Tier Plus, but here the CLL *structurally cannot* produce the number — it has no path to the ledger except through the deterministic port.

## Strengths / trade-offs

* ✅ **Boundary is structural** — the Dependency Rule makes "AI can't decide money" a compile-time fact, not a code-review hope.
* ✅ **Swappable AI** — LLM/runtime is outer infrastructure; replace or remove it without touching the core.
* ✅ **Core is trivially testable** — pure use cases, no AI or infra in the way.
* ⚠️ **More upfront design** — ports, adapters, and inversion cost ceremony; overkill for thin CRUD.
* ⚠️ **Orchestration ambiguity** — deciding what belongs in a use case vs. the CLL adapter (e.g., multi-step agentic flows) needs care so business rules don't leak outward into the adapter.

***

# The proofs, generalized

Three core cases, shown to hold the determinism boundary in **both** architectures. In each, the CLL contribution is genuinely valuable *and* strictly non-authoritative.

| Borrower-visible capability | CLL contribution (proposes) | BLL authority (decides) | What would break if swapped |
|---|---|---|---|
| Repayment scenarios / payment target | **CLL-10 · CLL-3** choose & narrate scenarios | **BLL-13 · BLL-5 · BLL-7** compute months, interest, payoff | Figures would drift from statements/ledger |
| Feature & program relevance | **CLL-5 · CLL-12** rank by usefulness | **BLL-25 · BLL-1** grant access / eligibility | User could see or be offered something they can't have |
| Forgiveness progress | **CLL-18** explain *why* a payment didn't count | **BLL-20** hold the qualifying-payment count | An over-optimistic count → real consumer harm |

**Eligibility trace (both styles):** CLL-12 ranks *candidate* assistance programs → the gate (N-Tier) or the `DetermineEligibility` port (Clean) calls **BLL-1/BLL-25** → only rule-granted programs are rendered, each with its authoritative status. The CLL never widens the set; it only orders it.

**Regulated-counter trace (both styles):** CLL-18 retrieves the borrower's payment ledger and explains disqualifying reasons → **BLL-20** supplies the count. The CLL may say *"three payments in 2023 didn't count because the plan wasn't qualifying"*; it may never say *"you have 118 of 120"* on its own authority.

```mermaid
flowchart LR
  A["CLL proposes<br/>CLL-3 · CLL-5 · CLL-10 · CLL-12 · CLL-18"] --> G{"Boundary<br/>Gate / Dependency Rule"}
  G --> D["BLL decides<br/>BLL-1 · BLL-13 · BLL-20 · BLL-25"]
  D --> R["Gated, authoritative response"]
  A -.->|"never bypasses"| D
```

***

# Choosing between them

| Dimension | N-Tier *Plus* | Clean *Plus* |
|---|---|---|
| CLL placement | Peer of BLL in the logic tier | Outer-ring adapter (a "detail") |
| Boundary enforcement | Runtime **Determinism Gate** | Compile-time **Dependency Rule** |
| BLL isolation from infra | Partial (shares tier/data access) | Strong (pure core) |
| Adoption cost | Low — fits existing layering | Higher — ports/adapters ceremony |
| Blast radius of AI change | Contained to logic tier | Contained to outer ring |
| Best when | Evolving an existing N-Tier app toward AI | Building AI-augmented systems where auditability is paramount |

Both are legitimate. **N-Tier Plus** is the pragmatic on-ramp for an existing platform; **Clean Plus** is the stronger long-term stance for a regulated domain because it makes the determinism boundary a property of the *structure* rather than of *discipline*.

***

> **Closing principle:** BLL and CLL are composable, not competing. Whichever style you pick, aggregate them so the AI is *grounded, gated, and non-load-bearing for decisions* — the CLL makes the platform **understandable and adaptive**, while the BLL keeps it **correct, reproducible, and provable**.
