# 05 — Opportunities & Solutions (TOGAF ADM: Phase E)

## Decisions Log

### Decision 1: Monolith vs microservices

- **Context:** This is a demo app. Should it mirror a production architecture (microservices) or be simpler?
- **Options evaluated:**
  | Option | Pros | Cons |
  |---|---|---|
  | Monolith (Next.js all-in-one) | Zero setup, single deploy, fast iteration | Not representative of production architecture |
  | Microservices (separate frontend + backend) | Closer to production reality | Complex setup, slower iteration, no demo value added |
- **Decision:** Monolith. One Next.js project handles frontend, API routes, and background logic.
- **Consequences:** Demo is faster to build and run. When moving to production, the separation into frontend + backend microservices is explicitly documented in README as the migration path.

---

### Decision 2: SQLite vs PostgreSQL

- **Context:** What database to use for storing demo cases and interactions?
- **Options evaluated:**
  | Option | Pros | Cons |
  |---|---|---|
  | SQLite (via Prisma) | Zero config, single file, portable, instant startup | Not suitable for production scale |
  | PostgreSQL + Docker | Production-realistic, supports concurrent writes | Requires Docker, adds setup time, overkill for demo |
- **Decision:** SQLite. The demo runs with a single file — no Docker, no setup beyond `npm install`.
- **Consequences:** Demo is portable and runs anywhere. Migration to PostgreSQL in production is a known, documented step.

---

### Decision 3: SSE vs WebSockets for real-time updates

- **Context:** The agent inbox and dashboard need to update in real time when new cases arrive.
- **Options evaluated:**
  | Option | Pros | Cons |
  |---|---|---|
  | Server-Sent Events (SSE) | Trivial to implement in Next.js, no extra infrastructure | Unidirectional (server → client only) |
  | WebSockets | Bidirectional, full real-time | Requires separate infra (Socket.io, Pusher, etc.) |
  | RabbitMQ / SQS | Production-grade message queuing | Way overkill for a demo |
- **Decision:** SSE. The demo only needs server → client updates (new case arrived, status changed). SSE is native to HTTP and requires zero infrastructure.
- **Consequences:** Real-time feel without operational complexity. Production would replace this with WebSockets + message queues.

---

### Decision 4: No authentication

- **Context:** Should the demo have login/user management?
- **Options evaluated:**
  | Option | Pros | Cons |
  |---|---|---|
  | No auth | Zero friction, works instantly in a demo | Not production-realistic |
  | Auth0 / Clerk | Realistic, role-based access | Adds 1-2 days of setup, creates friction in demos |
- **Decision:** No authentication. The demo assumes a single tenant and open access.
- **Consequences:** Anyone with the URL can access all views. Acceptable for a demo. Production would add SSO + RBAC.

---

### Decision 5: Real Claude API vs mocked AI

- **Context:** Should the bot use real AI or scripted responses?
- **Options evaluated:**
  | Option | Pros | Cons |
  |---|---|---|
  | Real Claude API | Genuine conversational intelligence, impresses clients | Costs money per token, requires API key |
  | Mocked/scripted responses | Free, predictable | Obvious and unimpressive in a live demo |
- **Decision:** Real Claude API. This is the core of Arena's value proposition — the AI must be real.
- **Consequences:** Requires `ANTHROPIC_API_KEY`. Small token cost per demo run. Unpredictable responses (feature, not bug).

---

## Build vs Buy vs Reuse

| Capability | Approach | Solution | Rationale |
|---|---|---|---|
| UI components | Reuse | shadcn/ui | Open source, customizable, professional look with zero design effort |
| Charts / dashboards | Reuse | Recharts | Simple API, composable, good enough for demo KPIs |
| AI / bot | Buy (API) | Anthropic Claude API | Core value proposition — not core to build, but must be real |
| ORM / data access | Reuse | Prisma | Best-in-class for Next.js + TypeScript; handles SQLite and PostgreSQL |
| Real-time updates | Build | Custom SSE endpoint | Trivial to build; no library needed |
| Routing engine | Build | Custom (`src/lib/routing.ts`) | Simple rule-based logic; no external dependency needed |
| SLA engine | Build | Custom (`src/lib/sla.ts`) | Date arithmetic + thresholds; straightforward to implement |
| Channel adapters | Build | Custom (`src/lib/channels.ts`) | Simulated channels share one interface; no external lib needed |

## Dependencies & Risks

| Dependency / Risk | Impact | Mitigation |
|---|---|---|
| Anthropic Claude API availability | Bot stops working if API is down during a demo | Cache last response as fallback; have scripted backup for demo scenarios |
| Claude API rate limits | Bot may throttle during high-volume demos | Use demo-appropriate models; avoid parallel test runs |
| SQLite file corruption | Loss of all demo data | Committed seed script regenerates data in seconds (`npx prisma db seed`) |
| Demo URL sharing | No auth means anyone with the link sees all data | Use demo-only data (never real PII); rotate deployment URL per client if needed |

## Work Packages

| Package | Description | Dependencies | Priority |
|---|---|---|---|
| WP-1: Project setup | Next.js 15, Tailwind, shadcn/ui, Prisma + SQLite, TypeScript config | None | High |
| WP-2: Data model + seeder | Prisma schema for Caso + Interaccion + Agente; seed 200–500 cases | WP-1 | High |
| WP-3: Bot + channel simulator | Chat UI with channel picker + Claude API for intent detection + case creation | WP-2 | High |
| WP-4: Agent console | Case inbox with filters + SLA indicators + case detail + reply + status actions | WP-2 | High |
| WP-5: AI suggestions | Claude suggests response drafts in case detail view | WP-4 | Medium |
| WP-6: Dashboards | Operational + business KPIs using Recharts | WP-2 | Medium |
| WP-7: SSE real-time | Inbox and dashboard update live when new cases arrive | WP-3, WP-4, WP-6 | Medium |
| WP-8: Alerts view | SLA at-risk, overloaded agents, volume anomalies | WP-6 | Low |
