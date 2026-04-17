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
| 5 | AI must be real, not mocked | Both the text bot (Claude) and the voice bot (OpenAI Realtime) use real AI APIs. Both have graceful simulation fallbacks when API keys are absent, but the production demo uses real AI. |
| 6 | No authentication | Single tenant, open access. Auth adds friction to demos and has no value here. |
| 7 | Right AI for the right job | Claude (Anthropic) handles text conversations — best reasoning and intent detection. OpenAI Realtime API handles voice — only option with native low-latency audio streaming via WebRTC. These are not interchangeable. |
| 8 | Adaptable to any client | The demo must be reconfigurable per prospect at runtime. Company profiles (JSON) are injected into AI prompts without touching code or redeploying. |

## Constraints

- **Text bot stack:** Anthropic Claude (`claude-sonnet-4-20250514`) via `@anthropic-ai/sdk`
- **Voice bot stack:** OpenAI Realtime API (`gpt-4o-mini-realtime-preview`) via WebRTC
- **Database:** SQLite via Prisma — single file, no external DB
- **Deployment:** Docker on Railway (production) or `npm run dev` (local)
- **Budget:** Minimal — Claude tokens + OpenAI Realtime minutes per demo session
- **Single developer (AI-assisted):** No CI/CD pipeline beyond Railway auto-deploy on push
- **No real customer data:** All data is seeded/simulated. Never use real PII.
- **Profiles:** 6 company profiles available (Megacable, JLL, MedTech, Banco, Ecommerce, Telco). Adding a new client requires only a new JSON file.
