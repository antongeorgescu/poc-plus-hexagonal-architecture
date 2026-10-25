# Security-annotated sequence diagrams

**System:** Hexagonal Student-Loan POC · **Basis:** the code on branch `keyword-search`

The [data-flow diagram](threat-model.png) shows *where* data goes. These diagrams show *in what order* things happen on the three flows that matter most, and **who checks what at each step**. Red shading marks a weakness in the code as it stands; green marks the control a fix would add. Threat IDs (T1…, R21…) refer to the [risk register](itsg-33-risk-register.md).

Each flow has a **"today"** diagram and, where the design changes, a **"target"** diagram that follows [authn-authz-design.md](authn-authz-design.md). PNG renders of every diagram are in [sequence-diagrams/](sequence-diagrams/).

| Diagram | Flow | Shows |
|---|---|---|
| [SD-1](#sd-1--login-today) | Login, today | No session, no throttling, plain-text comparison |
| [SD-2](#sd-2--login-and-an-authorised-request-target) | Login and an authorised request, target | Hashed password, throttling, server-side session, scoped query |
| [SD-3](#sd-3--submit-a-payment-today) | Submit a payment, today | Decisions made in the browser; the API trusts the client's schedule |
| [SD-4](#sd-4--submit-a-payment-target) | Submit a payment, target | The client sends intent; the server decides and records |
| [SD-5](#sd-5--update-contact-details-today) | Update contact details, today | Anyone can change anyone's contact details |
| [SD-6](#sd-6--update-contact-details-target) | Update contact details, target | Session, CSRF, step-up and a notice to the old address |
| [SD-7](#sd-7--ask-a-question-today) | Ask a question, today | The keyword model and the optional Azure path |

---

## SD-1 · Login, today

```mermaid
sequenceDiagram
    autonumber
    actor B as Borrower
    participant SPA as Angular app (browser)
    participant P as Dev-server proxy :4200
    participant API as Data API :3000
    participant DB as SQLite

    B->>SPA: username + password
    SPA->>P: POST /api/login (plain HTTP)
    P->>API: forward
    rect rgb(255, 228, 228)
        Note over SPA,P: T8: credentials cross the network unencrypted
    end
    API->>DB: SELECT password WHERE username = ? (prepared statement)
    DB-->>API: stored password (PLAIN TEXT)
    rect rgb(255, 228, 228)
        API->>API: compare strings
        Note over API,DB: T6 plain-text storage<br/>T2 no throttle, no lockout, no audit entry
    end
    alt credentials match
        API-->>P: 200 { user } (no password in the record)
        P-->>SPA: response + "Access-Control-Allow-Origin: *" (added by the dev server)
        SPA->>SPA: keep the user in memory
        rect rgb(255, 228, 228)
            Note over SPA,API: T1: no token, no cookie.<br/>Later requests carry only a username
        end
    else no match
        API-->>SPA: 401 "Invalid username or password."
        Note over API,SPA: same message for unknown user and wrong password (good)
    end
```

## SD-2 · Login and an authorised request, target

```mermaid
sequenceDiagram
    autonumber
    actor B as Borrower
    participant SPA as Angular app (browser)
    participant E as TLS edge / reverse proxy
    participant API as Data API
    participant DB as Database
    participant L as Audit log

    B->>SPA: username + password
    SPA->>E: POST /api/login (HTTPS)
    E->>API: forward (rate limit applied at the edge)
    rect rgb(226, 245, 226)
        API->>API: per-IP and per-account throttle check
        API->>DB: read password hash (dummy hash if user unknown)
        API->>API: constant-time hash compare
    end
    alt success
        API->>DB: create session (store HASH of a 256-bit id)
        API->>L: login success (actor, IP, user agent)
        API-->>SPA: 200 + Set-Cookie __Host-sid (HttpOnly, Secure, SameSite=Strict)
    else failure or locked
        API->>L: login failure
        API-->>SPA: 401 same message, Retry-After when limited
    end

    Note over B,L: ---- later: an authorised request ----
    SPA->>E: GET /api/payments/history (cookie only, no username)
    E->>API: forward
    rect rgb(226, 245, 226)
        API->>DB: look up session, check idle and absolute timeout
        API->>API: build context { borrowerId }
        API->>DB: SELECT ... WHERE borrower_id = ctx.borrowerId
    end
    API->>L: read ledger (actor, outcome)
    API-->>SPA: 200 ledger (newest first)
    Note over API,DB: a foreign or unknown object returns the same 404
```

## SD-3 · Submit a payment, today

```mermaid
sequenceDiagram
    autonumber
    actor B as Borrower
    participant SPA as Angular app (browser)
    participant API as Data API
    participant DB as SQLite

    B->>SPA: amount, funding source, apply-to
    rect rgb(255, 228, 228)
        SPA->>SPA: processPayment + applyPayment (the DECISION is made here)
        SPA->>SPA: make reference with Math.random
        Note over SPA,API: T3 a modified client can pick any outcome<br/>T4 reference chosen by the client
    end
    SPA->>API: POST /api/payments { username, reference, amount, expectedBalance, updated{ balance, nextPaymentDate, nextPaymentAmount, paymentsMade, onTimeStreak } }
    rect rgb(255, 228, 228)
        Note over SPA,API: T1 the borrower is taken from the BODY, not from a session
    end
    API->>API: check shapes and types of every field
    API->>DB: BEGIN IMMEDIATE
    API->>DB: find borrower by body.username
    alt expectedBalance differs from the stored balance
        API->>DB: ROLLBACK
        API-->>SPA: 409 "Your account changed..."
        Note over API: control that works: stale writes are refused
    else balance arithmetic does not add up
        API->>DB: ROLLBACK
        API-->>SPA: 400
    else accepted
        API->>DB: INSERT payment_history
        API->>DB: UPDATE loan balance
        rect rgb(255, 228, 228)
            API->>DB: UPDATE payment SET the schedule fields AS SENT
            Note over API,DB: T3 date, amount, count and streak are only type-checked
        end
        API->>DB: COMMIT
        API-->>SPA: 201 { user }
    end
    Note over API,DB: T5 no audit record of who or from where
```

## SD-4 · Submit a payment, target

```mermaid
sequenceDiagram
    autonumber
    actor B as Borrower
    participant SPA as Angular app (browser)
    participant API as Data API
    participant DB as Database
    participant L as Audit log

    B->>SPA: amount, funding source, apply-to
    SPA->>API: POST /api/payments { amount, fundingSource, applyTo, idempotencyKey } + cookie + CSRF token
    rect rgb(226, 245, 226)
        API->>API: authenticate session, verify CSRF token, check Origin, require JSON
        API->>API: if amount is above the threshold, require step-up
    end
    API->>DB: BEGIN IMMEDIATE
    rect rgb(226, 245, 226)
        API->>DB: read loan and schedule for ctx.borrowerId
        API->>API: processPayment + applyPayment (the DECISION is made on the server)
        API->>API: make the reference on the server
        API->>DB: idempotency key already used?
    end
    alt key already used
        API->>DB: ROLLBACK
        API-->>SPA: 200 the original result (replay does nothing new)
    else new request
        API->>DB: INSERT payment_history, UPDATE loan, UPDATE payment
        API->>L: payment recorded (actor, amount, reference, IP)
        API->>DB: COMMIT
        API-->>SPA: 201 { result }
    end
    Note over SPA,API: the client never sends schedule fields, a borrower id or a reference
```

## SD-5 · Update contact details, today

```mermaid
sequenceDiagram
    autonumber
    actor A as Anyone (attacker)
    participant API as Data API
    participant DB as SQLite
    actor V as Victim borrower

    A->>API: POST /api/profile { username: "victim", referenceNumber, updated{ email, phone, mailingAddress } }
    rect rgb(255, 228, 228)
        Note over A,API: T1 no login and no session needed.<br/>R21 works from any web page (text/plain, no preflight)
    end
    API->>API: validate shapes (email form, phone digits, non-empty address)
    API->>DB: BEGIN IMMEDIATE, find borrower by body.username
    API->>DB: UPSERT borrower_contact
    API->>DB: INSERT profile_update_history (reference, values, time)
    API->>DB: COMMIT
    API-->>A: 201 { user }
    rect rgb(255, 228, 228)
        Note over API,V: T5 the history row records no actor or IP.<br/>The victim is never notified
    end
    Note over A,V: AP2: the attacker now owns the contact channel
```

## SD-6 · Update contact details, target

```mermaid
sequenceDiagram
    autonumber
    actor B as Borrower
    participant SPA as Angular app (browser)
    participant API as Data API
    participant DB as Database
    participant N as Notifier
    participant L as Audit log

    B->>SPA: new email, phone or address
    SPA->>API: POST /api/profile/start-change + cookie + CSRF token
    rect rgb(226, 245, 226)
        API->>API: authenticate session, verify CSRF and Origin
        API-->>SPA: 401 step-up required
    end
    SPA->>B: ask for the password again (or an MFA code)
    B->>SPA: password
    SPA->>API: POST /api/profile { updated, stepUp }
    rect rgb(226, 245, 226)
        API->>API: verify step-up, then validate the new values
        API->>DB: UPDATE borrower_contact WHERE borrower_id = ctx.borrowerId
        API->>DB: INSERT profile_update_history (only what changed)
    end
    API->>L: contact changed (actor, IP, fields changed)
    API->>N: notify the OLD address and the new one
    N-->>B: "your contact details were changed. Not you? Act now"
    API->>DB: end the other sessions
    API-->>SPA: 200
    Note over N,B: the borrower finds out even if the session was hijacked (blunts AP2)
```

## SD-7 · Ask a question, today

```mermaid
sequenceDiagram
    autonumber
    actor B as Borrower
    participant SPA as Angular app (browser)
    participant API as Data API
    participant KW as Keyword router (server)
    participant P as Dev-server proxy
    participant AZ as Azure OpenAI (optional)

    B->>SPA: "Show me my payment history"
    SPA->>API: POST /api/language-model/classify { text, candidate topic names }
    rect rgb(255, 228, 228)
        Note over SPA,API: T1 / R21 no authentication, no Origin check.<br/>Text capped at 2,000 characters, body at 16 KB (controls that work)
    end
    API->>KW: classify(text, allowed topics)
    KW->>KW: normalise, stem, match, score, pick (bounded wildcards, no backtracking risk)
    KW-->>API: topic + scores + matched keywords
    API-->>SPA: { category }
    SPA->>SPA: the core stamps the determinism flag and label (the model cannot change them)
    SPA->>API: GET /api/payments/history?username=...
    API-->>SPA: ledger
    rect rgb(255, 245, 220)
        Note over SPA,AZ: Only when Azure mode is enabled (off by default)
        SPA->>P: POST /api/azure-ai/... (question text, figures, first name, tier)
        P->>AZ: HTTPS + api-key header added by the proxy
        Note over P,AZ: R20 the route has no authentication: an open relay.<br/>T10 balances, rate and dates leave the boundary
        AZ-->>P: topic label or prose
        P-->>SPA: response
        SPA->>SPA: validate the label against the core's topic list (T14 mitigated)
    end
```
