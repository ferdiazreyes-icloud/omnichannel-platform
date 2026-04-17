# 05 — Opportunities & Solutions (TOGAF ADM: Phase E)

## Decisions Log

### Decision 1: Monolith vs microservices

- **Context:** Should the demo mirror production architecture or be simpler?
- **Options evaluated:**
  | Option | Pros | Cons |
  |---|---|---|
  | Monolith (Next.js all-in-one) | Zero setup, single deploy, fast iteration | Not representative of production architecture |
  | Microservices | Closer to production reality | Complex setup, no demo value added |
- **Decision:** Monolith. One Next.js project handles frontend, API routes, and all background logic.
- **Consequences:** Faster to build. Migration to frontend + backend microservices is documented in `06-migration-planning.md`.

---

### Decision 2: SQLite vs PostgreSQL

- **Context:** What database for storing demo cases and interactions?
- **Options evaluated:**
  | Option | Pros | Cons |
  |---|---|---|
  | SQLite (via Prisma) | Zero config, single file, instant startup, Railway-compatible | Not suitable for production scale |
  | PostgreSQL + Docker | Production-realistic | Requires managed DB, adds cost and setup |
- **Decision:** SQLite. Runs everywhere with zero setup. Railway supports SQLite file persistence.
- **Consequences:** Portable, no DB infra cost. Migration to PostgreSQL in production is a known step.

---

### Decision 3: SSE vs WebSockets for real-time UI updates

- **Context:** Agent inbox and dashboard need live updates when new cases arrive.
- **Options evaluated:**
  | Option | Pros | Cons |
  |---|---|---|
  | Server-Sent Events (SSE) | Native to HTTP, trivial in Next.js, no infra | Unidirectional (server → client) |
  | WebSockets | Bidirectional | Requires separate infra |
- **Decision:** SSE. Only server → client updates are needed. Zero infrastructure.
- **Consequences:** Production would replace with WebSockets + message queues.

---

### Decision 4: No authentication

- **Context:** Should the demo have login/user management?
- **Decision:** No auth. Single tenant, open access. Auth adds friction in demos.
- **Consequences:** Anyone with the URL can access all views. Acceptable for demo-only use.

---

### Decision 5: Real AI vs mocked responses

- **Context:** Should bots use real AI or scripted responses?
- **Decision:** Real AI with graceful fallback. Both Claude and OpenAI Realtime are called in production. When keys are absent, both fall back to simulation mode (scripted responses, same UX).
- **Consequences:** Demo is impressive with keys. Works offline without them (for development).

---

### Decision 6: Claude (Anthropic) vs OpenAI for voice

- **Context:** The text bot uses Claude. Can Claude also handle the voice channel?
- **Options evaluated:**
  | Option | Pros | Cons |
  |---|---|---|
  | Claude (Anthropic) | Already in use, best reasoning | No audio API — text only; would require separate STT + TTS pipeline |
  | OpenAI Realtime API | Native audio streaming via WebRTC, low latency, built-in VAD + transcription | Separate API key; different model than text bot |
- **Decision:** OpenAI Realtime API for voice, Claude for text. Right tool for the right job.
- **Consequences:** Two AI providers in the stack. Two separate API keys. Two independent simulation fallbacks. The voice system prompt still uses the active company profile — same personalization strategy as text.

---

### Decision 7: Configurable company profiles

- **Context:** The demo is shown to clients in different industries. A telecom demo should say "Megacable" and know about cable plans; a real estate demo should say "JLL" and know about facilities management. Re-deploying for each client is not viable.
- **Options evaluated:**
  | Option | Pros | Cons |
  |---|---|---|
  | Static demo (one company) | Simpler code | Sales rep must explain "imagine this was your company" |
  | Per-client deployment | Perfect fit | Requires a deploy per prospect |
  | JSON profiles + runtime injection | One deploy, any client | Requires profile authoring per new client |
- **Decision:** JSON profiles loaded in memory (`src/lib/perfiles.ts`), injected into AI system prompts at request time. Profile selected from the home page with no login.
- **Consequences:** Adding a new client = writing one JSON file. No code changes, no redeploy needed.

---

### Decision 8: Railway vs Vercel for hosting

- **Context:** Where to deploy the demo?
- **Options evaluated:**
  | Option | Pros | Cons |
  |---|---|---|
  | Vercel | Zero-config for Next.js, fast CDN | Does not support SQLite in production (serverless functions = no persistent filesystem) |
  | Railway + Docker | Supports persistent filesystem (SQLite), full control, reasonable cost | Slightly more setup (Dockerfile needed) |
- **Decision:** Railway with Docker. SQLite persistence is critical — the demo data must survive between visits.
- **Consequences:** Dockerfile required. Auto-deploy on push to the feature branch. Production URL: `omnichannel-platform-production.up.railway.app`.

---

## Build vs Buy vs Reuse

| Capability | Approach | Solution | Rationale |
|---|---|---|---|
| UI components | Reuse | shadcn/ui | Professional, open source, zero design effort |
| Charts | Reuse | Recharts | Simple API, good enough for demo KPIs |
| Text AI / bot | Buy (API) | Anthropic Claude | Best reasoning; core demo value |
| Voice AI | Buy (API) | OpenAI Realtime | Only viable low-latency audio option for browser |
| ORM | Reuse | Prisma | Best-in-class for Next.js + TypeScript |
| Real-time updates | Build | Custom SSE | Trivial to build; no external lib needed |
| Routing engine | Build | Custom (`src/lib/routing.ts`) | Simple rules; no external dependency |
| SLA engine | Build | Custom (`src/lib/sla.ts`) | Date arithmetic; straightforward |
| Company profiles | Build | JSON + in-memory registry | One JSON per client; injected into AI prompts |

## Dependencies & Risks

| Dependency / Risk | Impact | Mitigation |
|---|---|---|
| Anthropic API down during demo | Text bot stops working | Simulation fallback activates automatically |
| OpenAI Realtime API down during demo | Voice bot stops working | Simulation fallback activates automatically |
| SQLite file loss on Railway | All demo data lost | Seeder runs on every deploy — data restores in seconds |
| Railway restart mid-demo | Brief downtime | `restartPolicyType: ON_FAILURE` + 10 retries configured |
| Demo URL shared publicly | No auth = anyone can access | Use demo-only data (no real PII); acceptable for demo context |

## Work Packages

| Package | Status | Notes |
|---|---|---|
| WP-1: Project setup (Next.js, Tailwind, Prisma, TypeScript) | ✅ Done | |
| WP-2: Data model + seeder (300 cases) | ✅ Done | Runs on `postbuild` |
| WP-3: Text bot + channel simulator (Claude) | ✅ Done | |
| WP-4: Agent console (inbox + case detail + SLA) | ✅ Done | |
| WP-5: AI response suggestions | ✅ Done | |
| WP-6: Dashboards (operational + business, Recharts) | ✅ Done | |
| WP-7: SSE real-time updates | ✅ Done | |
| WP-8: Alerts view | ✅ Done | |
| WP-9: Voice channel inbound (OpenAI Realtime + WebRTC) | ✅ Done | |
| WP-10: Company profiles system (6 clients, runtime injection) | ✅ Done | |
| WP-11: Interactive guided tour | ✅ Done | |
| WP-12: Command Center `/demo` page | ✅ Done | |
| WP-13: Railway deployment (Docker) | ✅ Done | |
| WP-14: Outbound voice calls to real phones | ⏳ Planned | Via Vapi.ai — next feature |
