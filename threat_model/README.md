# Threat model — Hexagonal Student-Loan POC

This folder holds the security analysis for the project: what could go wrong, how an attacker would do it, what the code does about it today, and what to build next. Everything is based on the code on branch `keyword-search` and was last reviewed on **2026-10-25**.

> **The headline.** The injection and input-handling controls hold. Authentication, authorisation and cross-site protection **do not exist yet**, so anyone who can reach the API can read or change any borrower's data. That is acceptable for a one-machine demo with synthetic data and **not acceptable for anything else**. Phase 0 of the [remediation plan](remediation-plan.md) is the gate.

---

## 1. Where to start

| If you want to… | Read |
|---|---|
| See how the system is built, tier by tier | [architecture-multitier.png](architecture-multitier.png) |
| See the whole picture on one page | [threat-model.png](threat-model.png) |
| Understand how an attacker would chain the weaknesses | [attack-paths.png](attack-paths.png) |
| Know what to fix first | [remediation-plan.md](remediation-plan.md) |
| See every artifact, whether it is required, and who is accountable | [threat-model-artifacts.md](threat-model-artifacts.md) |
| See every artifact, whether it is required, and who is accountable | [threat-model-artifacts.md](threat-model-artifacts.md) |
| See the risks by ITSG-33 control family | [itsg-33-risk-register.md](itsg-33-risk-register.md) |
| See what was actually tested | [security-test-plan.md](security-test-plan.md) |

---

## 2. The documents

### Analysis

| Document | What it answers |
|---|---|
| [architecture-multitier.png](architecture-multitier.png) · [.drawio](architecture-multitier.drawio) | **The architecture** the threat model is built on: the hexagon (core, ports, adapters) across the browser, proxy, API and database tiers. |
| [threat-model.png](threat-model.png) · [.drawio](threat-model.drawio) | **Data-flow diagram** with trust boundaries and the STRIDE threat register (T1–T15, R16–R22). |
| [attack-paths.png](attack-paths.png) · [.drawio](attack-paths.drawio) | **Ten attack paths** (AP1–AP10) from entry to impact, the paths that do not work, and the choke-point controls (C1–C10). |
| [sequence-diagrams.md](sequence-diagrams.md) · [PNGs](sequence-diagrams/) | **Security-annotated sequences** for login, payment and profile update, today and target. |
| [itsg-33-risk-register.md](itsg-33-risk-register.md) | **Risks and mitigations by ITSG-33 control family**, with file-and-line evidence. |
| [privacy-threat-model-linddun.md](privacy-threat-model-linddun.md) | **Privacy threats** (PT-01–PT-22) that exist even without an attacker. |
| [llm-threat-checklist.md](llm-threat-checklist.md) | The **OWASP LLM Top 10** applied to the *optional* Azure path. |
| [data-inventory-and-categorization.md](data-inventory-and-categorization.md) | **What data is held, where it goes, how sensitive it is**, and a proposed categorization. |
| [dependency-and-vendor-review.md](dependency-and-vendor-review.md) · [sbom.cdx.json](sbom.cdx.json) | **Software supply chain** and third-party review; the SBOM (920 components). |

### Design and requirements

| Document | What it answers |
|---|---|
| [authn-authz-design.md](authn-authz-design.md) | **How to authenticate and authorise**: sessions, passwords, CSRF, the endpoint-by-role matrix. |
| [target-deployment.png](target-deployment.png) · [.drawio](target-deployment.drawio) | **The production layout** the fixes build toward, with trust zones and controls. |
| [abuse-cases-security-requirements.md](abuse-cases-security-requirements.md) | **Requirements** (SR-01–SR-27) with Given/When/Then acceptance criteria. |
| [architecture-decision-records.md](architecture-decision-records.md) | **Why** the system is built this way, and which decisions must change (ADR-001–ADR-012). |
| [logging-incident-recovery.md](logging-incident-recovery.md) | **What to log, what to alert on, how to respond and recover** (DET-01–DET-13, PB-1–PB-6). |

### Plan and evidence

| Document | What it answers |
|---|---|
| [remediation-plan.md](remediation-plan.md) | **Work items** (REM-01–REM-21) with owner role, phase, effort, dependencies and a done-when. |
| [security-test-plan.md](security-test-plan.md) | **Tests** (TC-01–TC-31) with the results observed on 2026-10-25. |
| [artifact-matrix.png](artifact-matrix.png) · [.drawio](artifact-matrix.drawio) | **Who owns what, and when**: the artifacts of [threat-model-artifacts.md](threat-model-artifacts.md) by SDLC phase and accountable team. |
| [test_cases/](test_cases/README.md) | **Threat test cases**: 32 by OWASP Top 10 (OT-01–OT-32) and 12 by attack path (AT-01–AT-12), not yet run. |

---

## 3. Identifier conventions

IDs are stable and used across every document. Never reuse or renumber one; add the next number.

| Prefix | Means | Defined in |
|---|---|---|
| **T1–T15** | Threats from the data-flow review (STRIDE) | [threat-model.png](threat-model.png), [register](itsg-33-risk-register.md) |
| **R16–R22** | Risks added after reading and testing the code | same |
| **AP1–AP10** | Attack paths | [attack-paths.png](attack-paths.png) |
| **C1–C10** | Choke-point controls | same |
| **PT-nn** | Privacy threats (LINDDUN) | [privacy-threat-model-linddun.md](privacy-threat-model-linddun.md) |
| **SR-nn** · **MC-nn** | Security requirements · misuse cases | [abuse-cases-security-requirements.md](abuse-cases-security-requirements.md) |
| **REM-nn** | Remediation work items | [remediation-plan.md](remediation-plan.md) |
| **TC-nn** | Security tests | [security-test-plan.md](security-test-plan.md) |
| **DET-nn** · **PB-n** | Detections · incident playbooks | [logging-incident-recovery.md](logging-incident-recovery.md) |
| **ADR-nnn** | Architecture decisions | [architecture-decision-records.md](architecture-decision-records.md) |
| **LLM01–LLM10** | OWASP LLM Top 10 categories | [llm-threat-checklist.md](llm-threat-checklist.md) |

How they connect: **risk (T/R) → attack path (AP) → control (C) → requirement (SR) → work item (REM) → test (TC)**.

---

## 4. Status snapshot (2026-10-25)

| Measure | Value |
|---|---|
| Risks | **22**: 6 High, 12 Medium, 4 Low |
| High risks | T1, T2, T3, T6, T7, R21 |
| Attack paths | 10 (AP1–AP10) |
| Remediation items | 21 open; 8 in Phase 0 |
| Security tests | 31: 18 fail (insecure), 6 pass, 1 partly, 6 future |
| Dependencies | 920 packages (11 runtime); 8 runtime and 71 total flagged by `npm audit` |
| Open decisions for the owner | Classification and categorization, retention, Azure policy, support roles ([data inventory](data-inventory-and-categorization.md), section 5) |

---

## 5. Keeping it current

A threat model that is not updated becomes a false comfort. These rules keep it honest.

### 5.1 Review when any of these happens

| Trigger | Review |
|---|---|
| A **new endpoint**, route or integration | Data-flow diagram, endpoint matrix ([authn-authz-design.md](authn-authz-design.md)), test plan |
| A **new data field** or table | [Data inventory](data-inventory-and-categorization.md), privacy model, retention |
| A **change to who can do what** | Role matrix, abuse cases, tests |
| A new **dependency**, or a major upgrade | [Dependency review](dependency-and-vendor-review.md); regenerate the SBOM |
| **Azure** (or any external service) is enabled, or what it receives changes | Vendor review, LLM checklist, privacy model |
| A **fix lands** (a REM item closes) | Move its risks to "mitigated", flip the matching tests to required passes, update the snapshot above |
| An **incident or near miss** | Add the cause as a risk or path; add a detection; update the playbook |
| **Quarterly**, regardless | Re-run the tests, `npm audit`, and check the snapshot against reality |
| **Before real data** | Complete Phase 0, run every test, get sign-off ([remediation-plan.md](remediation-plan.md), section 4) |

### 5.2 When you change one document, check its neighbours

| You changed | Also check |
|---|---|
| A risk or its rating | The register, the diagrams, the remediation plan, the counts in section 4 |
| A control or fix | The attack-path table, the requirement, the test, the deployment diagram |
| A test result | The test-plan summary and the traceability tables |
| An endpoint | The sequence diagrams and the role matrix |

### 5.3 Regenerating the generated parts

| Artifact | How |
|---|---|
| [sbom.cdx.json](sbom.cdx.json) | `node threat_model/make-sbom.mjs` |
| Test results | Re-run the commands in [security-test-plan.md](security-test-plan.md), section 5. Run the data-changing tests only against a disposable copy of the database. |
| `.drawio` diagrams | Open in [draw.io](https://app.diagrams.net) and edit. The PNG exports were made with the draw.io desktop CLI: `draw.io -x -f png -s 1.5 -b 20 -o file.png file.drawio`. |
| Sequence diagrams | Written in Mermaid inside [sequence-diagrams.md](sequence-diagrams.md), which GitHub and VS Code render; the PNGs in `sequence-diagrams/` are renders and can lag the text, so treat the markdown as the source. |

### 5.4 Ownership

Every artifact has one accountable **team**, always one of seven: **Product**, **Architecture**, **Development**, **QA**, **DevOps**, **AppOps** or **Cybersecurity** ([threat-model-artifacts.md](threat-model-artifacts.md)). The roles below are the people who do the work inside those teams; they are the owner names used in the [remediation plan](remediation-plan.md).

| Role | Team | Owns |
|---|---|---|
| **System owner** | Product | The risk decisions, the categorization, the sign-offs on the remediation plan |
| **Architect** | Architecture | The architecture views, the data-flow diagram and STRIDE threat register, the LLM threat assessment, the authentication design, the decision records |
| **Dev lead** | Development | Implementing the requirements, the risk register (TRA), the third-party and supply chain review, the remediation plan, the security-annotated sequence diagrams, and the Phase 0 and 1 fixes |
| **QA lead** | QA | The security test plan, its traceability matrix, the attack-path test cases and the test results |
| **Ops / platform** | DevOps | The deployment diagram, the deployment configuration and policy-as-code recorded in the risk register, deployment, backups, logging and TLS, to the design Architecture owns |
| **App ops lead** | AppOps | The logging and monitoring requirements, incident response and recovery plans, and running them |
| **Privacy officer** | Cybersecurity | The privacy model, retention, notice and the Azure decision |
| **Security assessor** | Cybersecurity | The security requirements, and independent review and authorization |

Roles are placeholders; assign people in the remediation plan.

---

## 6. Limits

- This is a **first-pass analysis**, not a penetration test, an audit or a compliance finding. A professional test is recommended before real data is loaded.
- Ratings are judgement calls for the app as built, rated as if it were reachable beyond localhost.
- ITSG-33 control IDs were written from the Annex 3A catalogue and should be checked against the current published version and the profile chosen.
- Test results are for one machine on one date.
- Nothing in this folder has been committed to git or published.
