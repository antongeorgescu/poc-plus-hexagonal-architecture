# Architectures Comparison — Hosting the CLL/BLL "Plus" Model

Three ways to structure the **same POC**, each enforcing the one invariant that defines the **Plus** architecture — *the **CLL** (cognitive/AI layer) proposes; the **BLL** (deterministic core) disposes* — but enforcing it through a different mechanism. This note collects the trio, describes each architecture's core idea, and answers: **which is conceptually easiest to adapt to the CLL/BLL model?**

> Background on the CLL/BLL split and the "Plus" pattern: [plus_architecture.md](plus_architecture.md).

## The Trio (cross-linked)

| Diagram | Pattern | Shape | Boundary mechanism |
|---|---|---|---|
| [ntier_component_diagram.md](ntier_component_diagram.md) | **N-Tier Plus** | Horizontal tiers (Presentation → Logic → Data) | Runtime **Determinism Gate** |
| [clean_component_architecture.md](clean_component_architecture.md) | **Clean** | Concentric rings (Entities → Use Cases → Adapters → Frameworks) | Compile-time **Dependency Rule** |
| [hexagonal_component_architecture.md](hexagonal_component_architecture.md) | **Hexagonal (Ports & Adapters)** | Core + symmetric driving/driven adapters | The **Port** (every interaction crosses one) |

All three place the deterministic BLL at the center of authority and treat the CLL as a non-load-bearing collaborator; they differ only in **where the CLL sits** and **how the boundary is enforced** — never in **whether** it holds.

---

## Core descriptions

### 1. N-Tier (→ N-Tier Plus)

**Core idea.** Classic **horizontal layering**: Presentation depends on Logic, which depends on Data. Each tier calls the one beneath it. It's the default mental model for most enterprise apps.

**Where the CLL/BLL split lands.** The Logic Tier is split into two **peer "seats"** — a CLL seat and a BLL seat — with an explicit **Determinism Gate** between them. The gate is the seam every consequential result must pass through so the AI's proposal is computed/authorized by deterministic code before it reaches the UI.

**Strengths.** Lowest friction to adopt; the CLL slots into an existing tier and teams keep their layering intuition. The gate is a single, testable place.

**Trade-offs.** The boundary is **procedural, not structural** — because tiers know their neighbours concretely, a sloppy CLL *could* reach around the gate straight into Data. Discipline is enforced by code review and runtime checks, not by the compiler. The BLL isn't intrinsically isolated from infrastructure (it shares the tier and often the data access).

### 2. Clean Architecture

**Core idea.** **Concentric rings** governed by the **Dependency Rule**: source-code dependencies point **inward only**. The center is pure domain (Entities), wrapped by application Use Cases, then Interface Adapters, then Frameworks & Drivers on the outside.

**Where the CLL/BLL split lands.** The BLL **is** the inner core (Entities + Use Cases). The CLL is just another **outer-ring adapter** — a plug-in like the DB or the UI — that depends *inward* on the use-case ports and can never be depended upon by the core.

**Strengths.** The boundary is **structural**: "the AI can't decide money" becomes a **compile-time fact**, not a review-time hope. The core is trivially testable and the LLM is swappable outer infrastructure. Strong isolation from frameworks.

**Trade-offs.** More upfront design ceremony (ports, adapters, inversion); overkill for thin CRUD. Deciding what belongs in a use case vs. the CLL adapter (multi-step agentic flows) needs care so rules don't leak outward.

### 3. Hexagonal (Ports & Adapters)

**Core idea.** A **technology-agnostic core** exposes **ports** (interfaces); the outside world plugs in through **adapters**. Two symmetric sides: **driving (primary)** adapters that *drive* the core, and **driven (secondary)** adapters that the core *drives*. Closely related to Clean, but framed around adapter symmetry rather than rings.

**Where the CLL/BLL split lands.** The BLL is the **core (the hexagon)**. The CLL is **just another driving adapter** — no more privileged than the UI, a test harness, or a future agent console — that drives the core through the **same driving ports** as everything else. Its grounding data is served behind **driven ports**, so nothing bypasses the core.

**Strengths.** The cleanest **conceptual mapping** of the CLL: it is *literally* "one adapter among several." Symmetric replaceability (swap the LLM, unplug the CLL, the UI still drives the same ports). Core is fully technology-agnostic and testable via port doubles.

**Trade-offs.** Same ceremony cost as Clean (ports/adapters everywhere). The primary/secondary distinction can confuse teams new to the style; more interfaces to maintain than a pragmatic N-Tier retrofit.

---

## Which is conceptually easiest to adapt to CLL/BLL?

Separate two questions that are easy to conflate:

| Question | Winner | Why |
|---|---|---|
| Easiest to **retrofit** onto an existing app | **N-Tier Plus** | The CLL drops into the current logic tier; add one gate. No re-architecting. |
| **Cleanest conceptual fit** for CLL/BLL | **Hexagonal** *(Clean a close second)* | The model *is* the pattern: BLL = core, CLL = just another adapter, "propose/dispose" = "cross a port." |
| Strongest **enforcement / auditability** | **Clean** *(Hexagonal a close second)* | The Dependency Rule makes the boundary a compile-time invariant. |

### Verdict — conceptually, Hexagonal is the most natural fit

The CLL/BLL model is, at heart, a claim about **who is core and who is a replaceable detail**: the deterministic rules are authoritative and permanent; the AI is a swappable collaborator that may only *propose*. **Hexagonal states exactly that with no translation:** the BLL is the core, and the CLL is simply another **driving adapter** plugged into a port — the same category of thing as the UI or a test. The invariant "the CLL proposes; the BLL disposes" becomes the plain hexagonal rule "**a driver may only call a port; it can never become the core.**" Because primary adapters are symmetric and swappable by definition, "grounded, gated, non-load-bearing" falls out of the pattern for free.

**Clean is a near-tie** — it expresses the identical idea (AI as an outer ring depending inward) and adds the strongest *enforcement* via the Dependency Rule; many teams treat Clean and Hexagonal as two framings of one architecture. If your priority is *provable* isolation for a regulated domain, lean **Clean**; if your priority is the *clearest conceptual model* of the CLL as one interchangeable driver among many, lean **Hexagonal**.

**N-Tier Plus is the easiest to *adopt* but the weakest conceptual fit:** it can *host* the CLL/BLL split, but the boundary is a bolt-on gate held in place by discipline rather than by structure — the AI's non-load-bearing status is a rule you must keep, not a fact the architecture guarantees.

> **Rule of thumb.** Retrofitting an existing system toward AI → **N-Tier Plus** as the pragmatic on-ramp. Designing for the CLL/BLL model from the start → **Hexagonal or Clean**, because they make "the AI is just a replaceable adapter" structurally true rather than merely intended. High audit/reproducibility needs tilt the choice toward **Clean**.

---

## See also
- [plus_architecture.md](plus_architecture.md) — the CLL/BLL "Plus" pattern and the N-Tier-vs-Clean trade-off in depth.
- [ntier_component_diagram.md](ntier_component_diagram.md) · [clean_component_architecture.md](clean_component_architecture.md) · [hexagonal_component_architecture.md](hexagonal_component_architecture.md) — the three component diagrams of the same POC.
