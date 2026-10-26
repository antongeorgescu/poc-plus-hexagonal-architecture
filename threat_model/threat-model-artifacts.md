# Threat model artifacts

The artifacts that make up the threat model for the Hexagonal Student-Loan POC, with whether each must be delivered, who is accountable for it, and where in the software development life cycle (SDLC) it belongs. The index and maintenance rules are in [README.md](README.md). Rows are grouped by SDLC phase (Requirements, Design, Implementation, Testing, Deployment, Operations) and, within each phase, Required before Optional.

| No. | Artifact Name | Artifact File | Delivery | Description | Accountable Team | SDLC Phase |
|---|---|---|---|---|---|---|
| 1 | Data Inventory and Security Categorization | [data-inventory-and-categorization.md](data-inventory-and-categorization.md) | Required | Every stored field, where it flows, how sensitive it is, and a proposed security categorization. It settles the control profile the other artifacts assume. | Product | Requirements |
| 2 | Security Requirements | [abuse-cases-security-requirements.md](abuse-cases-security-requirements.md) | Required | Misuse cases turned into 27 security requirements (SR-01 to SR-27) with Given/When/Then acceptance criteria that become tests. | Cybersecurity | Requirements |
| 3 | System Architecture Diagram | [architecture-multitier.drawio](architecture-multitier.drawio) · [architecture-multitier.png](architecture-multitier.png) | Required | The hexagonal architecture (core, ports, adapters, composition root) laid out across the deployment tiers: browser, proxy, API and database. The foundation the threat-model diagram is drawn on. | Architecture | Design |
| 4 | Threat Model: Data Flow Diagram (DFD) with STRIDE Threat Register | [threat-model.drawio](threat-model.drawio) · [threat-model.png](threat-model.png) | Required | Data-flow diagram with trust boundaries and the STRIDE threat register (T1–T15, R16–R22). The core threat-model artifact. | Architecture | Design |
| 5 | Authentication and Authorization Design (Access Control Matrix) | [authn-authz-design.md](authn-authz-design.md) | Required | How to authenticate and authorise: sessions, password storage, lockout, CSRF defence, and the endpoint-by-role matrix. | Architecture | Design |
| 6 | ARB Security Decisions | [architecture-decision-records.md](architecture-decision-records.md) | Required | Why the system is built as it is, which weaknesses were deliberate proof-of-concept trade-offs, and which decisions must change. | Architecture | Design |
| 7 | Attack Tree (Attack Path Analysis) | [attack-paths.drawio](attack-paths.drawio) · [attack-paths.png](attack-paths.png) | Required | Ten attack paths from entry point to impact, the paths that do not work today, and the choke-point controls that break the most paths. | Cybersecurity | Design |
| 8 | Privacy Threat Model (LINDDUN) | [privacy-threat-model-linddun.md](privacy-threat-model-linddun.md) | Required | LINDDUN is a threat-modelling method for privacy, the way STRIDE is for security. Privacy threats (PT-01 to PT-22) that exist even without an attacker. A feeder for the privacy impact assessment, which itself is required. | Cybersecurity | Design |
| 9 | LLM Application Threat Assessment (OWASP Top 10 for LLM Applications) | [llm-threat-checklist.md](llm-threat-checklist.md) | Optional | OWASP LLM Top 10 applied to the optional Azure OpenAI path. Required only if Azure is ever enabled. | Architecture | Design |
| 10 | Threat and Risk Assessment (TRA) with Security Control Mapping | [itsg-33-risk-register.md](itsg-33-risk-register.md) | Required | Risks and mitigations grouped by ITSG-33 control family, with file-and-line evidence and a prioritised fix order. | Development | Implementation |
| 11 | Third-Party and Supply Chain Risk Assessment | [dependency-and-vendor-review.md](dependency-and-vendor-review.md) | Required | Third parties that see data or code (npm packages, Google Fonts, Azure OpenAI), known advisories, and the conditions for enabling Azure. | Development | Implementation |
| 12 | Security Remediation Plan | [remediation-plan.md](remediation-plan.md) | Required | Plan of action: 21 work items with owner role, phase, effort, dependencies and a done-when, plus risk-treatment decisions and sign-off. | Development | Implementation |
| 13 | Security-Annotated Sequence Diagrams | [sequence-diagrams.md](sequence-diagrams.md) | Optional | Security-annotated sequence diagrams for login, payment and profile update, today and target, with PNG renders. | Development | Implementation |
| 14 | Security Test Plan (with Traceability Matrix) | [security-test-plan.md](security-test-plan.md) | Required | 31 security tests tied to threats and attack paths, with the results observed on 2026-10-25 and the commands to rerun them. | QA | Testing |
| 15 | Generate attack paths test cases | [attack-path-test-cases.md](test_cases/attack-path-test-cases.md) | Required | Twelve end-to-end scenarios (AT-01 to AT-12), one per attack path plus a chained takeover and a detection check, each with steps, the point where the attack must be stopped and the secure result expected. | QA | Testing |
| 16 | PenTest Report | To be produced (no file yet) | Required | Findings from an authorised penetration test of the running system: scope and rules of engagement, method, and each finding with severity, evidence and steps to reproduce, plus the retest result once fixes are in. It confirms or refutes the threat model and feeds new findings back into the risk register and remediation plan. | Cybersecurity | Testing |
| 17 | TRA Update: Deployment Configuration and Policy-as-Code | [itsg-33-risk-register.md](itsg-33-risk-register.md) | Required | DevOps updates this document (the Threat and Risk Assessment) with the deployment configuration and policy-as-code: which control each setting and rule implements, and the evidence that it is in force. | DevOps | Deployment |
| 18 | Deployment Diagram | [target-deployment.drawio](target-deployment.drawio) · [target-deployment.png](target-deployment.png) | Required | The production layout the fixes build toward: trust zones, edge, secrets, logging, backups and where each control sits. | DevOps | Deployment |
| 19 | Security Logging and Monitoring Requirements, Incident Response Plan and Recovery Plan | [logging-incident-recovery.md](logging-incident-recovery.md) | Required | Audit-event catalogue, detections, incident-response playbooks, and backup and restore requirements. | AppOps | Operations |
| 20 | Threat Model Index and Maintenance Guide | [README.md](README.md) | Required | Index of the folder, identifier conventions, status snapshot, and the rules for keeping the threat model current. | Cybersecurity | Operations |

---

## How to read the columns

### Artifact Name and Artifact File

**No.** is the artifact's number in this table. It follows the row order (SDLC phase, then Required before Optional), so it changes if a row is added, removed or moved. Cite artifacts by name, not by number, outside this table.

**Artifact Name** is the name the practice is generally known by in security and architecture work, so the artifact can be recognised and requested by that name. Acronyms are given where the field uses them: DFD (data flow diagram), TRA (threat and risk assessment), ARB (Architecture Review Board).

**Artifact File** is the file in this folder that holds it. Where one artifact has a source and an export, both are listed (for example the `.drawio` and its `.png`).

### Delivery

| Value | Meaning |
|---|---|
| **Required** | Needed before real borrower data is loaded or the system goes to production. Without it, a security decision has nothing to rest on. |
| **Optional** | Adds clarity or depth but is not a gate. Skipping it does not leave a risk undecided. |

This split is a proposal for a system holding Protected B personal information. The system owner can promote or demote any row. The **LLM application threat assessment** is Optional today and becomes required if Azure OpenAI is enabled. The **privacy threat model** and the **attack tree** are Required: the first is an input to the privacy impact assessment, which is itself required for real personal data; the second keeps the attack paths that the choke-point fixes are chosen from in front of reviewers.

### Accountable Team

One team is accountable for each artifact: it answers for the content being correct and kept current. Others contribute. The value is always one of seven teams.

| Team | Accountable for |
|---|---|
| **Product** | What must be protected and what the business accepts: categorization, the risk-treatment decisions and the sign-offs on the remediation plan |
| **Architecture** | How the system is structured and how it will defend itself: the architecture views, the data-flow diagram and its STRIDE threat register, the LLM application threat assessment, authentication design and decision records |
| **Development** | Building it: implementing the requirements, the risk register that maps each risk to a control and a fix, the third-party and supply chain review, the remediation plan, and the security-annotated sequence diagrams |
| **QA** | Proving it: the security test plan, its traceability matrix, the attack-path test cases and the test results |
| **DevOps** | Deploying it: the deployment diagram, its update of the risk assessment with deployment configuration and policy-as-code, and the platform, TLS, secrets and backups |
| **AppOps** | Running the application and responding when it is attacked or fails: security logging and monitoring, the incident response plan and the recovery plan |
| **Cybersecurity** | Finding and rating the threats, and specifying what the system must do about them: the security requirements, attack paths, privacy analysis and the penetration test report |

Operations and platform work (TLS, backups, secrets, monitoring) is carried out by DevOps, with AppOps running monitoring and response, with QA verifying the controls and Development and QA reviewing the requirements so they are buildable and testable, to the target design that Architecture owns and the detections that Cybersecurity defines. The named roles used in the [remediation plan](remediation-plan.md) (for example "Dev lead" and "Ops / platform") are the people who do the work inside these teams.

### SDLC Phase

The phase in which the artifact is first needed. Most are kept current afterwards.

| Phase | What happens | Artifacts |
|---|---|---|
| **Requirements** | Decide what must be protected and what the system shall do about threats | Data inventory; security requirements |
| **Design** | Describe the architecture, analyse threats and decide how the system will defend itself | Architecture diagram, threat model, authentication design, attack paths, privacy model, LLM checklist, decision records |
| **Implementation** | Build the fixes and produce build-time evidence | Risk register (TRA), third-party review, remediation plan, sequence diagrams |
| **Testing** | Prove the controls work | Security test plan; attack-path test cases; penetration test report |
| **Deployment** | Release to the target environment as designed, and record how it is configured and governed | Deployment diagram; the DevOps update of the risk assessment (deployment configuration and policy-as-code) |
| **Operations** | Run, monitor, respond and maintain | Logging, incident and recovery; the index and maintenance rules |

---

## Summary

| Measure | Count |
|---|---|
| Artifacts | 20 |
| Required | 18 |
| Optional | 2 |
