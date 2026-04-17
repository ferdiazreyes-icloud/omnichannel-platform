# 06 — Migration Planning (TOGAF ADM: Phase F)

> This file documents the path from this demo to a production system.
> This is NOT a migration from an existing system — it is a greenfield demo.
> This file serves as a forward-looking guide if Arena Analytics decides to productize.

---

## Current State (Demo — As-Is)

- **System:** Arena Omnichannel Demo (`omnichannel-platform`)
- **Purpose:** Sales and validation tool — not production
- **What works well today:** Fast to run, zero infrastructure, real AI, full journey simulation
- **Limitations to address before production:** No auth, SQLite, no real channel integrations, no multi-tenancy, no compliance controls, monolithic architecture

## Target State (Production — To-Be)

A multi-tenant SaaS platform where real companies connect their actual communication channels (WhatsApp, Twilio, Meta API), manage real customer cases, and operate with full security, compliance, and scalability.

## Migration Strategy

**Chosen approach:** Phased

The demo validates the UX and product decisions. Each production phase replaces one demo component at a time without discarding the full codebase — the Next.js frontend and business logic are reusable.

## Migration Phases

| Phase | What changes | Demo equivalent | Notes |
|---|---|---|---|
| 1 | Split frontend + backend; add authentication (SSO + RBAC) | Next.js monolith + no auth | Frontend stays Next.js; backend moves to FastAPI or Actix |
| 2 | Replace SQLite with PostgreSQL + Redis | SQLite | Add connection pooling, caching, session management |
| 3 | Replace SSE with WebSockets + message queue (RabbitMQ/SQS) | SSE | Enables bidirectional real-time and event-driven architecture |
| 4 | Replace Claude API direct calls with AI orchestrator | `src/lib/ai.ts` direct calls | Adds fallbacks, rate limiting, model routing, observability |
| 5 | Replace simulated channels with real integrations | `src/lib/channels.ts` adapters | WhatsApp Business API, Twilio (SMS/Voice), Meta Messenger |
| 6 | Add multi-tenancy, CRM/CDP integrations, compliance controls | Single-tenant, open access | LFPDPPP compliance, data isolation, audit logging |

## Data Migration

- **Data to migrate:** None from demo → production (demo uses seed data only, never real PII)
- **Schema reuse:** Prisma schema (`Caso`, `Interaccion`, `Agente`) is production-ready in structure; only the database engine changes (SQLite → PostgreSQL)
- **Validation:** Run seed script on production schema to verify compatibility before go-live

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Demo UX decisions that don't scale | Rework in production phase | Flag demo-only shortcuts explicitly in code comments |
| Client expects demo = production features | Scope mismatch | Always clarify demo limitations at the start of sales meetings |
| Over-engineering production prematurely | Wasted effort on demo | Enforce demo principles in `00-principles.md` — no production features in demo |
