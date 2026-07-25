# Plus-Architecture Compatibility Assessment

A **fact-based, measurable framework** for deciding whether a given solution should adopt a **"Plus" architecture** — a classic style (N-Tier or Clean) **aggregating a deterministic Business Logic Layer (BLL) with a cognitive CLL**, under the invariant *"the CLL proposes; the BLL disposes."*

It is a scored questionnaire: answer each question against **observable evidence**, roll the answers up through fixed weights, and obtain a **final compatibility score from 1 to 5** (5 = highest compatibility), plus a recommended Plus **variant**.

* Concept and layers: [plus_architecture.md](plus_architecture.md)
* The deterministic building block: [bll_cases.md](bll_cases.md)
* The cognitive building block: [cll_cases.md](cll_cases.md)
* Consolidated inventory: [cases_list.md](cases_list.md)

> **How to keep it honest:** every score must cite evidence (a document, a test, a metric, a code seam) — not an opinion. If you can't point to evidence, the score is **1** by default until you can.

***

## 1. Scoring model at a glance

Seven weighted dimensions. Each dimension holds 2–3 questions scored **1–5** against the anchors below. A dimension's score is the **average** of its questions. The final score is the **weighted sum** of dimension scores (already on a 1–5 scale).

| # | Dimension | What it gauges | Weight |
|---|-----------|----------------|:------:|
| D1 | **Deterministic Core Clarity** | Is there a real BLL to protect? | 20% |
| D2 | **Cognitive Value Opportunity** | Is there real CLL value to add? | 15% |
| D3 | **Data Grounding & Quality** | Can the CLL be grounded and trusted? | 15% |
| D4 | **Regulatory, Audit & Explainability** | Does the boundary pay off? | 15% |
| D5 | **Architectural Readiness & Modularity** | Can a CLL be inserted cleanly? | 15% |
| D6 | **Governance & Delivery Capability** | Can you run AI responsibly? | 10% |
| D7 | **Risk Containment & HITL Feasibility** | Can the AI stay non-load-bearing? | 10% |

**Final score formula**

```text
Final = 0.20·D1 + 0.15·D2 + 0.15·D3 + 0.15·D4 + 0.15·D5 + 0.10·D6 + 0.10·D7
        (each D = mean of its question scores, 1–5)
```

Then apply the **capping rules (§4)** and read the **band (§5)**.

***

## 2. The framework — dimensions, questions & measurable anchors

Each row: the diagnostic **question**, the **evidence to measure**, and anchors at **1 / 3 / 5**.

### D1 — Deterministic Core Clarity *(weight 20%)*

| Question | Measure (evidence) | 1 | 3 | 5 |
|---|---|---|---|---|
| D1.1 What share of consequential decisions (money, access, compliance) are expressible as explicit rules? | % of such decisions with documented, codifiable rules | <20% or tacit/subjective | 40–79% codifiable | ≥80% already codified **and** unit-tested |
| D1.2 Are those decisions reproducible? | Same input → same output, regression-tested | Non-reproducible | Mostly, some manual | Fully deterministic, regression-covered |
| D1.3 Can use cases be cleanly sorted into "must be exact" vs "interpretive"? | A split like [cases_list.md](cases_list.md) exists | Tangled, no split | Partial/informal split | Documented BLL/CLL split |

*Rationale:* Plus exists to **protect a deterministic boundary**. No boundary → nothing for Plus to add (see cap C1).

### D2 — Cognitive Value Opportunity *(weight 15%)*

| Question | Measure | 1 | 3 | 5 |
|---|---|---|---|---|
| D2.1 How many high-value CLL-type opportunities (summarize, explain, predict, personalize) address a real user pain? | Count of concrete, sponsored opportunities (cf. CLL-9, CLL-10, CLL-15, CLL-23) | 0–1 or speculative | 2–4 concrete | ≥5 concrete, high-value |
| D2.2 Is the expected impact quantified? | Deflection %, minutes saved/interaction, conversion lift | Unquantified/marginal | Estimated, moderate | Measured/benchmarked, material |

*Rationale:* If there's little to summarize, explain, or personalize, Plus is over-engineering (see cap C2).

### D3 — Data Grounding & Quality *(weight 15%)*

| Question | Measure | 1 | 3 | 5 |
|---|---|---|---|---|
| D3.1 Is there an authoritative system of record the CLL can read for grounding? | Availability + API/query access to the SoR | Fragmented / no SoR | Exists, awkward access | Clean, API-accessible SoR |
| D3.2 Is there approved, maintained content for retrieval (RAG)? | Curated, governed knowledge base (cf. CLL-24) | None | Ad-hoc docs | Curated KB with ownership & review |
| D3.3 Is data quality/completeness adequate for any predictive use? | Completeness, freshness, labeling, monitoring | Poor/unknown | Adequate, unmonitored | High, monitored for drift |

*Rationale:* Ungrounded AI hallucinates; grounding is the precondition for every CLL case (see cap C3).

### D4 — Regulatory, Audit & Explainability *(weight 15%)*

| Question | Measure | 1 | 3 | 5 |
|---|---|---|---|---|
| D4.1 How strong are auditability/reproducibility obligations? | Regulatory regime, audit mandates | None | Moderate | Heavy (audit + reproducibility mandated) |
| D4.2 Must consequential outcomes trace to rule + version + inputs? | Traceability requirement + feasibility | Not needed/feasible | Partly | Required and feasible |
| D4.3 Are decision-explanation duties present (e.g., adverse-action, cf. BLL-29)? | Explicit obligations | None | Some | Yes, formal |

*Rationale:* The stricter the auditability need, the **more the Plus boundary pays off** — and the more it points toward **Clean Plus** (structural enforcement).

### D5 — Architectural Readiness & Modularity *(weight 15%)*

| Question | Measure | 1 | 3 | 5 |
|---|---|---|---|---|
| D5.1 Is the current architecture layered/modular with clear seams? | Style: mud-ball vs N-Tier vs Clean/hexagonal | Big-ball-of-mud | Layered but coupled | Clean/ports-adapters or clean N-Tier |
| D5.2 Can a CLL be inserted as a peer (N-Tier) or adapter (Clean) without rewriting the core? | Presence of ports/interfaces/seams | No seams | Some refactor needed | Ports exist; drop-in |
| D5.3 Is business logic already separated from presentation and data? | Logic isolated from UI/DB | Scattered in UI/DB | Partly separated | Cleanly isolated |

### D6 — Governance & Delivery Capability *(weight 10%)*

| Question | Measure | 1 | 3 | 5 |
|---|---|---|---|---|
| D6.1 AI/model governance maturity? | Versioning, monitoring, bias/drift checks (SR 11-7-style) | None | Emerging | Established |
| D6.2 Team skills for prompt/agent engineering, MLOps, the "AI Expert" role? | Named roles & track record | Absent | Partial | In place |
| D6.3 Is there an AI evaluation harness (groundedness, hallucination, regression eval sets)? | Existence + use in CI | None | Manual/occasional | Automated, gating releases |

### D7 — Risk Containment & HITL Feasibility *(weight 10%)*

| Question | Measure | 1 | 3 | 5 |
|---|---|---|---|---|
| D7.1 Can the AI be kept non-load-bearing (removable without breaking the core)? | Design isolates AI from the decision path | AI on critical decision path | Partial | Non-load-bearing by design |
| D7.2 Can consequential actions be gated + human-reviewed at acceptable cost? | Feasible gate / HITL workflow | No | Costly/slow | Yes, practical |
| D7.3 Tolerance for LLM latency/cost, with fallback? | Latency budget + deterministic fallback | Hard real-time, no fallback | Tight, partial fallback | Tolerant + graceful fallback |

***

## 3. Aggregation

1. Score each **question** 1–5 with evidence.
2. **Dimension score** = mean of its questions.
3. **Final** = weighted sum per the formula in §1.
4. Apply **capping rules (§4)**.
5. Map to a **band (§5)** and select a **variant (§6)**.

***

## 4. Capping rules (fact-based guardrails)

These override the weighted average, because some conditions are disqualifying regardless of other strengths:

* **C1 — No boundary to protect.** If `D1 < 2` **and** the solution has consequential (money/access/compliance) decisions → the deterministic core is missing; **cap Final at 2**. Fix the BLL first.
* **C2 — Nothing cognitive to add.** If `D2 < 2` → Plus is over-engineering; **cap Final at 2**. Prefer a **pure BLL** (classic N-Tier/Clean, no CLL).
* **C3 — Ungrounded AI.** If `D3 < 2` → hallucination risk is unacceptable; **cap Final at 3** until grounding exists.
* **C4 — AI on the critical path.** If `D7.1 = 1` (AI cannot be made non-load-bearing) → the core Plus invariant is violated; **cap Final at 2**.

> A solution that trips C1 or C2 isn't a Plus candidate at all — it's either a **pure deterministic system** or a **standalone AI assistant**, not an aggregate of both.

***

## 5. Interpretation bands (final 1–5)

| Weighted score | Level | Meaning & recommended action |
|:---:|:---:|---|
| 4.5 – 5.0 | **5** | **Excellent fit.** Adopt Plus now; default to **Clean Plus** if D4 is high. |
| 3.5 – 4.4 | **4** | **Strong fit.** Adopt with targeted remediation of the lowest dimensions. |
| 2.5 – 3.4 | **3** | **Conditional fit.** Pilot on a bounded, high-value slice; close gaps before scaling. |
| 1.5 – 2.4 | **2** | **Weak fit.** Fix prerequisites (grounding, seams, governance) before committing. |
| 1.0 – 1.4 | **1** | **Not a fit.** Use a **pure BLL** or a **standalone AI assistant** instead. |

***

## 6. Which Plus variant? (once the score justifies adoption)

| Signal | Lean N-Tier *Plus* | Lean Clean *Plus* |
|---|---|---|
| Regulatory/audit need (D4) | Moderate | High |
| Architectural readiness (D5) | Layered but coupled; pragmatic on-ramp | Ports/adapters already present |
| Enforcement style desired | Runtime **Determinism Gate** | Compile-time **Dependency Rule** |
| Time-to-value vs. long-term rigor | Faster retrofit | Stronger structural guarantees |

**Rule of thumb:** `D4 ≥ 4` **or** `D5 ≥ 4` → **Clean Plus**; otherwise **N-Tier Plus** as the pragmatic first step, refactorable toward Clean later.

***

## 7. Scoring worksheet (copy per assessment)

| Dimension | Q scores (1–5) | Dimension mean | Weight | Weighted |
|---|---|:---:|:---:|:---:|
| D1 Deterministic Core Clarity | __ , __ , __ | __ | 0.20 | __ |
| D2 Cognitive Value Opportunity | __ , __ | __ | 0.15 | __ |
| D3 Data Grounding & Quality | __ , __ , __ | __ | 0.15 | __ |
| D4 Regulatory, Audit & Explainability | __ , __ , __ | __ | 0.15 | __ |
| D5 Architectural Readiness & Modularity | __ , __ , __ | __ | 0.15 | __ |
| D6 Governance & Delivery Capability | __ , __ , __ | __ | 0.10 | __ |
| D7 Risk Containment & HITL Feasibility | __ , __ , __ | __ | 0.10 | __ |
| **Final (sum of Weighted)** | | | **1.00** | **__** |
| Caps applied? (C1–C4) | | | | __ |
| **Compatibility level (1–5)** | | | | __ |
| **Recommended variant** | | | | __ |

***

## 8. Worked example — Student Loan Servicing Portal

Scoring the very platform behind [bll_cases.md](bll_cases.md) / [cll_cases.md](cll_cases.md):

| Dimension | Evidence | Mean | Weighted |
|---|---|:---:|:---:|
| D1 Deterministic Core | 33 codifiable BLL rules (accrual, amortization, PSLF count, eligibility), reproducible & testable | 5.0 | 1.00 |
| D2 Cognitive Value | 24 concrete CLL opportunities, several with quantifiable deflection/UX value | 5.0 | 0.75 |
| D3 Data Grounding | Authoritative ledger/SoR present; policy KB curation still maturing | 4.0 | 0.60 |
| D4 Regulatory/Audit | Heavily regulated; reproducibility + adverse-action explanation mandated | 5.0 | 0.75 |
| D5 Architectural Readiness | Established N-Tier; seams present but not full ports/adapters | 3.5 | 0.525 |
| D6 Governance | Model governance & AI eval harness emerging, not yet established | 3.0 | 0.30 |
| D7 Risk Containment | CLL designed as non-load-bearing; gating feasible | 4.0 | 0.40 |
| **Final** | no caps triggered (D1,D2,D3,D7.1 all ≥ 2) | | **≈ 4.3** |

**Result: 4.3 → Level 4 (Strong fit)**, with a clear path to **5** by maturing the knowledge-base curation (D3), formalizing AI governance/eval (D6), and introducing ports/adapters (D5). **Recommended variant: Clean Plus** (D4 = 5 ≥ 4), pursued incrementally from the current N-Tier via a Determinism Gate as the interim step.

***

> **Closing principle:** the framework rewards solutions that have *both* a **decision core worth protecting** and *interpretive work worth automating* — and that can keep the AI **grounded, gated, and non-load-bearing**. Score high on those, and a Plus architecture turns AI into value without putting the system's correctness at risk. Score low, and the honest answer is a **pure BLL** or a **standalone assistant** — not a Plus.
