# Dependency inventory and vendor review

**System:** Hexagonal Student-Loan POC · **Reviewed:** 2026-10-25 · **Basis:** `package-lock.json`, `npm audit`, and the code on branch `keyword-search`
**Closes / informs:** T15, T9, T10, R20, R22 · attack paths AP7, AP9 · remediation items REM-10, REM-11, REM-15
**ITSG-33 controls:** SA-9 (External Information System Services), SA-12 (Supply Chain Protection), SI-2 (Flaw Remediation), CM-8 (Component Inventory), RA-5 (Vulnerability Scanning)

This covers two things a threat model needs about *other people's code and services*: what is in the software supply chain, and which outside organisations see your data.

---

## 1. Software bill of materials

The SBOM is [sbom.cdx.json](sbom.cdx.json) (CycloneDX 1.5). It is generated from `package-lock.json`, the exact record of what `npm ci` installs, by [make-sbom.mjs](make-sbom.mjs):

```bash
node threat_model/make-sbom.mjs      # rewrites sbom.cdx.json
```

The file records the lockfile's SHA-256, so you can tell whether it still matches. Every component carries its version, a package URL, an integrity hash and (where the lockfile has one) a licence.

> **Why not `npm sbom`?** On this tree it was inconsistent: 6 components with `--omit dev`, 771 without, against 920 in the lockfile. Reading the lockfile directly is complete and reproducible.

| Measure | Value |
|---|---|
| Components | **920** |
| **Runtime** (shipped to the browser) | **11** |
| **Build-time tooling** (dev only) | **909** |
| Components with an integrity hash | 920 |

**Licences.** MIT 721 · ISC 97 · Apache-2.0 53 · BSD-2-Clause 21 · BSD-3-Clause 13 · BlueOak-1.0.0 7 · 0BSD 2 · and single instances of Python-2.0, CC-BY-4.0, CC-BY-3.0, CC0-1.0, `(BSD-3-Clause OR GPL-2.0)` and `(MIT OR CC0-1.0)`. All are permissive; the one dual-licensed `GPL-2.0` option is a *choice*, so BSD-3-Clause applies. Have legal confirm if this is ever distributed commercially.

### Runtime packages

| Package | Version | Role | Flagged by `npm audit` |
|---|---|---|---|
| `@angular/core` | 18.2.14 | Framework | **High** — 8 advisories |
| `@angular/common` | 18.2.14 | Common directives and pipes | **High** — 8 advisories |
| `@angular/compiler` | 18.2.14 | Template compiler | **High** — 7 advisories |
| `@angular/router` | 18.2.14 | Routing | **High** — 2 advisories |
| `@angular/forms` | 18.2.14 | Forms | Moderate — inherited from the above |
| `@angular/platform-browser` | 18.2.14 | Browser platform | Moderate — inherited |
| `@angular/platform-browser-dynamic` | 18.2.14 | Bootstrap | Moderate — inherited |
| `@angular/animations` | 18.2.14 | Animations | Moderate — inherited |
| `rxjs` | 7.8.2 | Reactive streams | Clean |
| `tslib` | 2.8.1 | TypeScript helpers | Clean |
| `zone.js` | 0.14.10 | Change detection | Clean |

---

## 2. Vulnerabilities

`npm audit` counts **packages**, not advisories. Both views matter:

| View | Runtime (11 packages) | Whole tree (920 packages) |
|---|---|---|
| Packages flagged | **8** (4 high, 4 moderate) | **71** (4 critical, 38 high, 22 moderate, 7 low) |
| Distinct advisories | **20**, of which **9** are XSS or sanitisation bypasses; worst CVSS **9.0** | not counted |

### 2.1 Runtime advisories, and whether this app is exposed

Many of the advisories affect only specific Angular features. The columns on the right come from searching **this** code base.

| Advisory family | Example | Needs this feature | Does the app use it? | Exposure |
|---|---|---|---|---|
| XSS in i18n attribute bindings (CVSS 9.0) | GHSA-g93w-mfhg-p222 | i18n / `$localize` | **No** (0 files) | None found |
| XSS via SVG script, SVG animation, MathML attributes | GHSA-jrmj-c5cx-3cw6, GHSA-v4hv-rgfq-gp49 | `<svg>` / MathML in templates | **No** (0 files) | None found |
| Template and attribute namespace sanitisation bypass | GHSA-f3m7-gqxr-g87x, GHSA-692r-grfm-v8x7 | Untrusted data bound to attributes or dynamic components | Two `[attr.*]` bindings, both numbers (`aria-label` from a percentage; `aria-valuenow` from a score) | Very low |
| Sanitisation bypass via host bindings; two-way binding bypass | GHSA-hh8m-fm6v-7cvg, GHSA-58w9-8g37-x9v5 | Host bindings or two-way bindings carrying untrusted data | No dynamic host bindings; forms bind user-typed text to component fields, not to markup | Very low |
| XSRF token leakage in the Angular HTTP client | GHSA-58c5-g7wp-6w37, GHSA-jfgx-762w-99vr | `HttpClient` | **No** — the app uses `fetch` | None |
| `HttpTransferCache` cache poisoning and leaks | GHSA-39pv-4j6c-2g6v, GHSA-q6f4-qqrg-jv6x | Server-side rendering / hydration | **No** | None |
| Denial of service in date and number formatting | GHSA-48r7-hpm6-gfxm, GHSA-p3vc-36g9-x9gr | `formatDate` / number pipes with attacker-controlled input | Pipes format **server-supplied** values (balances, dates), not free user input | Low |

**Reading.** On the evidence, the code base uses none of the vulnerable features in a way an attacker can reach. Treat that as **a reason the risk is Medium rather than High, not a reason to skip the upgrade**: a new component could start using one tomorrow, and the audit will keep flagging the build until the version moves.

### 2.2 The fix is a major upgrade

`npm audit` offers no patch within Angular 18: every fix is a **new major version** (the audit's suggested targets are Angular 20 and 22). That is a planned migration, not a routine update. Angular 18 is also an older release line, so **check its support status** with the Angular team's published schedule.

### 2.3 Build tooling

The four critical packages are all **dev-only** (`dev: true` in the lockfile), so none ships in the bundle:

| Package | Issue (summary) | Reached through | Fix |
|---|---|---|---|
| `piscina` | Prototype-pollution gadget leading to code execution | Angular build packages | Newer `@angular-devkit/build-angular` (major) |
| `tar` | Arbitrary file creation or overwrite through crafted archives | `npm`'s own install machinery, `node-gyp` | Newer `@angular/cli` (major) |
| `shell-quote` | Command injection via crafted tokens | A tooling dependency | `npm audit fix` |
| `proxy-addr` | IP spoofing through IPv4-mapped IPv6 trust subnets | Dev-server tooling | `npm audit fix` |

**Risk.** These matter to **whoever runs the build**: a malicious package or archive executes on a developer laptop or CI runner. They do not affect borrowers directly. **Mitigate** by building in a clean, short-lived CI container with no secrets, installing with `npm ci --ignore-scripts` where the build allows it, and upgrading the toolchain with Angular.

### 2.3a Runtime platform

| Item | Finding | Recommendation |
|---|---|---|
| Node.js | **v26.1.0, not an LTS release.** Non-LTS lines get short support and fewer backports. | Run a supported **LTS** release in production and CI. |
| `node:sqlite` | An **experimental** built-in module ([api.mjs](../server/api.mjs) and [build.mjs](../db/build.mjs) use it). Its API may change between releases. | Pin the Node version; plan a move to a stable driver or a managed database (see [target-deployment.png](target-deployment.png)). |
| Angular 18 | Older major line (section 2.2). | Include in the upgrade plan. |

---

## 3. Third parties that see data or can change behaviour

| Third party | When | What it sees or does | Status | Action |
|---|---|---|---|---|
| **Google Fonts** (`fonts.googleapis.com`) | **Every page view** | The visitor's IP address and user agent; serves a stylesheet the page trusts | **Active today** ([index.html:10](../src/index.html#L10)) — R22 | Self-host the font files or use system fonts (REM-15) |
| **Azure OpenAI** | **Only if enabled** (off by default) | Question text, first name, tier, loan and payment figures — see section 4 | Not enabled | Complete section 4 before enabling (REM-10) |
| **npm registry** | At build and install | Serves every package in the SBOM | Active | Lockfile with integrity hashes (done); `npm ci`; consider a mirror |
| **GitHub** | Source hosting | The repository, which includes synthetic seed data and the demo password | Active | Keep real data and secrets out of the repository (REM-02) |
| **draw.io / Google Fonts** | When the diagrams in this folder are opened or exported | Font stylesheet request | Documentation only; not part of the app | None |

---

## 4. Azure OpenAI vendor review

Azure OpenAI is **optional and off by default**; the default language model is the server-side keyword router, which sends nothing anywhere. This section is the checklist to complete **before it is ever turned on for real borrowers**.

### 4.1 What would be sent

From [azure-ai-language-model.ts](../src/app/adapters/driven/azure-ai-language-model.ts) (full table in [data-inventory-and-categorization.md](data-inventory-and-categorization.md)):

| Operation | Data |
|---|---|
| Classify | The borrower's question text; the business category descriptions |
| Narrate loan | Program of study, original and current balance, interest rate, % paid, months to maturity, maturity date |
| Narrate payments | Monthly payment, next amount and date, payments made and missed, streak, past-due flag and amount |
| Tone | A sentiment label |
| Welcome | First name and standing tier |

Not sent: password, email, phone, address, credit score, username, ledgers, chat recaps.

### 4.2 Questions to answer, with the current answer

| # | Question | Answer today |
|---|---|---|
| 1 | **Is there a legal basis and consent** to send this data to a third party? | None recorded |
| 2 | **Where is it processed and stored** (region and country)? | Depends on the Azure resource configured; not specified in the repo |
| 3 | **Is it retained**, for how long, and is it used for abuse monitoring or by staff? | Not checked; confirm the provider's current terms |
| 4 | **Is it used to train models?** | Confirm in writing from the provider's terms |
| 5 | **Who are the sub-processors?** | Not reviewed |
| 6 | **Is there a data-processing agreement** and does it cover this data? | None |
| 7 | **What security attestations** does the provider hold, and do they cover this service? | Not verified; ask for current reports rather than relying on marketing pages |
| 8 | **How is the call authenticated?** | A shared API key in an environment variable, added by the dev-server proxy; `directKey` mode exposes it to the browser (T9) |
| 9 | **Can the network path be restricted** (private endpoint, allow-listed egress)? | No: public HTTPS from the proxy |
| 10 | **How are cost and abuse limited?** | A client-side timeout of 8 s and token caps; **no per-user quota, no budget alert, and the route has no authentication** (R20) |
| 11 | **Is the provider's content filtering or logging a concern?** | Not reviewed |
| 12 | **How will a provider incident reach you?** | No contact or process defined |
| 13 | **Can you leave** (exit plan, data deletion)? | The keyword model is the fallback, so yes: no feature depends on Azure |

### 4.3 Conditions to enable (proposed)

Enable Azure OpenAI for real borrower data **only when all of these are true**:

1. The privacy officer has approved it and consent or authority is documented (REM-17).
2. Narration sends **rounded or relative figures** rather than exact balances and dates, or the exact figures are justified (REM-10).
3. The route requires authentication, is rate-limited, and has a spend budget with alerts (R20).
4. A managed identity or secret-store credential is used; `directKey` mode is removed (T9).
5. Items 2, 3, 4, 5, 6 and 7 above have written answers.
6. Outbound traffic is restricted to the approved endpoint.

---

## 5. Supply-chain practices

| Practice | State | Action |
|---|---|---|
| Lockfile committed, with integrity hashes | **Done** | Keep it; review every lockfile change |
| Install exactly what the lockfile says (`npm ci`) | Not enforced (no CI) | Use `npm ci` in CI (REM-14) |
| Run `npm audit` automatically | Manual | Fail the build on high or critical runtime advisories (REM-11) |
| Automated update proposals | None | Enable Dependabot (or similar) (REM-11) |
| SBOM per release | Generated on demand | Regenerate and archive it with each release |
| Block install scripts in CI | Not set | `--ignore-scripts` where the build allows |
| Verify package provenance | Not used | Run `npm audit signatures` in CI |
| Review new dependencies | Informal | Add a short checklist: purpose, maintainers, licence, size, install scripts |
| Minimise dependencies | **Good**: 11 runtime packages | Keep it that way; this is the strongest control in the table |

---

## 6. Actions

| Action | REM item | Closes |
|---|---|---|
| Plan the major Angular upgrade; add CI audit and Dependabot; move to an LTS Node | REM-11 | T15, AP7 |
| Remove the Google Fonts request; add a Content-Security-Policy | REM-15 | R22 |
| Authenticate and budget the Azure route; minimise the payload; remove `directKey` | REM-10 | T9, T10, R20, AP9 |
| Complete section 4.2 and get approval before enabling Azure | REM-17 | T10 |
| Build in a clean, secret-free CI environment | REM-14 | T15 |
