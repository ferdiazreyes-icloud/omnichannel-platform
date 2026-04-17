# 00 — Principles (TOGAF ADM: Preliminary)

> Immutable principles for this project. DO NOT modify unless FerDi explicitly requests it.

## Purpose

Define the non-negotiable rules and constraints that guide ALL decisions in this project.

## Principles

| # | Principle | Rationale |
|---|---|---|
| 1 | Demo first, production later | This is a sales/validation tool. Speed and clarity beat scalability. Every decision must optimize for demo quality, not production readiness. |
| 2 | Monolith over microservices | A single Next.js project handles everything. Splitting services adds complexity without value for a demo. |
| 3 | Zero external dependencies for data | SQLite only. No PostgreSQL, no Redis, no managed databases. The demo must run with a single `npm run dev`. |
| 4 | Simulated channels only | No real WhatsApp, Twilio, or Meta integrations. Channels are simulated via adapters with a shared interface. |
| 5 | AI must be real, not mocked | The conversational bot uses the actual Claude API (Anthropic). This is the core of the demo's value proposition — it must not be faked. |
| 6 | No authentication | Single tenant, open access. Auth adds friction to demos and has no value here. |

## Constraints

- **Stack is fixed:** Next.js 15 (App Router) + Tailwind CSS + shadcn/ui + Prisma + SQLite + Claude API
- **Budget:** Minimal — only cost is Claude API usage (pay-per-token)
- **Single developer (AI-assisted):** No CI/CD pipeline required; local dev only
- **No real customer data:** All data is seeded/simulated. Never use real PII.
- **Deployment:** Local only for MVP. If needed: Vercel + Turso (SQLite remote) as the simplest path.
