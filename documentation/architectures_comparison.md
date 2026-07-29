# Architectures Comparison — Hosting the CLL/BLL "Plus" Model

Three ways to structure the **same POC**, each enforcing the one invariant that defines the **Plus** architecture — *the **CLL** (cognitive/AI layer) proposes; the **BLL** (deterministic core) disposes* — but enforcing it through a different mechanism. This note collects the trio, describes each architecture's core idea, and answers: **which is conceptually easiest to adapt to the CLL/BLL model?**

> Background on the CLL/BLL split and the "Plus" pattern: [plus_architecture.md](plus_architecture.md).

## The Trio (cross-linked)

| Diagram | Pattern | Shape | Boundary mechanism |
|---|---|---|---|
| [ntier_component_diagram.md](ntier_component_diagram.md) | **N-Tier Plus** | Horizontal tiers (Presentation → Logic → Data) | Runtime **Determinism Gate** |
| [clean_component_architecture.md](clean_component_architecture.md) | **Clean** | Concentric rings (Entities → Use Cases → Adapters → Frameworks) | Compile-time **Dependency Rule** |
| [hexagonal_component_architecture.md](hexagonal_component_architecture.md) | **Hexagonal (Ports & Adapters)** | Two-region core + symmetric driving/driven adapters | The **Port** (every interaction crosses one) |

All three place the deterministic BLL at the center of authority and treat the CLL as a non-load-bearing collaborator; they differ only in **where the CLL sits** and **how the boundary is enforced** — never in **whether** it holds. Note that "non-load-bearing" is a claim about **authority, not about placement**: in the hexagonal POC the CLL lives *inside* the core and the invariant still holds, because it owns no authoritative computation and can only reach one through a port.

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

**Where the CLL/BLL split lands.** Both are **regions of the core**: a deterministic region (BLL) and a cognitive region (CLL), each exposing its own **driving ports** on the same edge of the hexagon — a driver cannot tell them apart. What separates them is not distance from the center but **authority**: one computes, the other phrases. The CLL reaches the BLL only through the BLL's driving ports — the same doors the UI uses — and reaches the **model** only through a **driven** `LanguageModelPort`. Grounding is likewise behind driven ports, so nothing bypasses a port.

**Why the CLL is core, not an adapter.** An adapter's job is to translate a *technology* into a port. The CLL services translate nothing — they hold policy (the fixed determinism map, the sentiment bands, the aggregation rule). Filing them in the adapter ring puts logic where technology belongs and leaves the genuinely foreign thing — the model runtime — with no port at all. Put the *policy* in the core and the *model* in the ring, and each sits where the pattern says it should.

**Strengths.** The cleanest **conceptual mapping** of the CLL/BLL model: cognition is first-class application logic, and the *model* is the interchangeable part. Symmetric replaceability (swap the LLM adapter, or delete the cognitive region outright, and the deterministic hexagon computes untouched). Core is fully technology-agnostic and testable via port doubles on both sides.

**Trade-offs.** Same ceremony cost as Clean (ports/adapters everywhere) — now for two regions. Requires naming discipline: "is this policy or technology?" is what decides core-vs-adapter, and getting it wrong is exactly the mistake this layout corrects. The primary/secondary distinction still confuses teams new to the style.

---

## Which is conceptually easiest to adapt to CLL/BLL?

Separate two questions that are easy to conflate:

| Question | Winner | Why |
|---|---|---|
| Easiest to **retrofit** onto an existing app | **N-Tier Plus** | The CLL drops into the current logic tier; add one gate. No re-architecting. |
| **Cleanest conceptual fit** for CLL/BLL | **Hexagonal** *(Clean a close second)* | The pattern *is* the model: BLL and CLL as two regions of one core, "propose/dispose" = "cross a port," and the LLM as a swappable driven adapter. |
| Strongest **enforcement / auditability** | **Clean** *(Hexagonal a close second)* | The Dependency Rule makes the boundary a compile-time invariant. |

### Verdict — conceptually, Hexagonal is the most natural fit

The CLL/BLL model is, at heart, a claim about **who holds authority and what is a replaceable detail**: the deterministic rules are authoritative and permanent; the AI is a collaborator that may only *propose*, and the model behind it is swappable. **Hexagonal states exactly that with no translation:** cognition and determinism are two regions of one core, each behind its own driving ports, and the **model** is a driven adapter. The invariant "the CLL proposes; the BLL disposes" becomes the plain hexagonal rule "**a caller may only call a port; it can never become the region behind it**" — which applies to the CLL calling the BLL exactly as it applies to the UI calling either. Because adapters are swappable by definition, "grounded, gated, non-load-bearing" falls out of the pattern for free — and so does "model-agnostic."

**A note on the tempting shortcut.** It is easy to express "the AI is non-load-bearing" by pushing the whole CLL into the adapter ring, and both Clean and Hexagonal invite it. That conflates two different claims — *the AI holds no authority* (true, and worth enforcing) and *the AI is a technology detail* (false: intent policy, grounding strategy and narration rules are application logic your business owns). Placement should follow **policy vs. technology**; authority is enforced by which ports a region is allowed to call.

**Clean is a near-tie** — it expresses the identical idea (AI depending inward on the core) and adds the strongest *enforcement* via the Dependency Rule; many teams treat Clean and Hexagonal as two framings of one architecture. The same policy-vs-technology reasoning applies there: the Dependency Rule is perfectly happy to host cognitive services in the **application layer** with the model behind an outbound port. If your priority is *provable* isolation for a regulated domain, lean **Clean**; if your priority is the *clearest conceptual model* — cognition first-class, model interchangeable — lean **Hexagonal**.

**N-Tier Plus is the easiest to *adopt* but the weakest conceptual fit:** it can *host* the CLL/BLL split, but the boundary is a bolt-on gate held in place by discipline rather than by structure — the AI's non-load-bearing status is a rule you must keep, not a fact the architecture guarantees.

> **Rule of thumb.** Retrofitting an existing system toward AI → **N-Tier Plus** as the pragmatic on-ramp. Designing for the CLL/BLL model from the start → **Hexagonal or Clean**, because they make "the AI is just a replaceable adapter" structurally true rather than merely intended. High audit/reproducibility needs tilt the choice toward **Clean**.

---

## See also
- [plus_architecture.md](plus_architecture.md) — the CLL/BLL "Plus" pattern and the N-Tier-vs-Clean trade-off in depth.
- [ntier_component_diagram.md](ntier_component_diagram.md) · [clean_component_architecture.md](clean_component_architecture.md) · [hexagonal_component_architecture.md](hexagonal_component_architecture.md) — the three component diagrams of the same POC.
