# Requirements Management (TOGAF ADM: Continuous)

> Living document. Updated throughout the project lifecycle as new requirements emerge or existing ones change.

## Functional Requirements

| ID | Requirement | Priority | Status | Source |
|---|---|---|---|---|
| FR-01 | Customer can select a channel (WhatsApp, SMS, Web Chat, Facebook) and start a bot conversation | Must have | ✅ Done | 01-architecture-vision |
| FR-02 | Bot detects intent (venta/soporte/cobranza/informacion) using Claude API | Must have | ✅ Done | 01-architecture-vision |
| FR-03 | Bot captures minimum data: customer name, subject, urgency | Must have | ✅ Done | 02-business-architecture |
| FR-04 | Bot creates a case with auto-assigned priority and SLA timestamps | Must have | ✅ Done | 02-business-architecture |
| FR-05 | Customer sees a case confirmation screen with case number and expected response time | Must have | ✅ Done | 02-business-architecture |
| FR-06 | Agent can view the case inbox filtered by status, priority, and SLA risk | Must have | ✅ Done | 01-architecture-vision |
| FR-07 | Agent can open a case and view the full interaction timeline | Must have | ✅ Done | 02-business-architecture |
| FR-08 | Agent can reply to a customer from a single interface regardless of origin channel | Must have | ✅ Done | 01-architecture-vision |
| FR-09 | Agent can add internal notes visible only to the team | Must have | ✅ Done | 02-business-architecture |
| FR-10 | Agent can change case status with validation (cannot close without documented resolution) | Must have | ✅ Done | 02-business-architecture |
| FR-11 | Agent can escalate or reassign a case | Must have | ✅ Done | 02-business-architecture |
| FR-12 | SLA countdown timer is visible on every case (green/yellow/red) | Must have | ✅ Done | 01-architecture-vision |
| FR-13 | Claude suggests response drafts to the agent based on case context | Should have | ✅ Done | 01-architecture-vision |
| FR-14 | Routing engine auto-assigns cases: intent → team, priority → SLA, load balancing | Must have | ✅ Done | 02-business-architecture |
| FR-15 | Operational dashboard: open cases by status, SLA compliance %, avg response times, volume by channel, agent load | Must have | ✅ Done | 01-architecture-vision |
| FR-16 | Business dashboard: conversion by channel/agent, cost per case, top contact reasons, volume trends | Should have | ✅ Done | 01-architecture-vision |
| FR-17 | Alerts view: SLA at-risk cases, overloaded agents, volume anomalies | Should have | ✅ Done | 01-architecture-vision |
| FR-18 | Dashboard and inbox update in real time via SSE when new cases arrive or statuses change | Should have | ✅ Done | 01-architecture-vision |
| FR-19 | Demo seeder generates 300 realistic cases from the last 30 days with varied channels, priorities, and resolution times | Must have | ✅ Done | README |
| FR-20 | Sales rep can select an active company profile from the home page (6 clients available) | Must have | ✅ Done | 02-business-architecture |
| FR-21 | Each company profile configures: name, enabled channels, intents, categories, agent teams, products, policies, SLAs, tone, welcome messages | Must have | ✅ Done | 03-information-systems |
| FR-22 | Voice channel: browser-based inbound call with OpenAI Realtime API + WebRTC, real-time transcription, auto case creation | Must have | ✅ Done | 01-architecture-vision |
| FR-23 | Interactive guided tour across all pages (Krug UX principles) | Should have | ✅ Done | — |
| FR-24 | `/demo` Command Center page showing end-to-end journey in a single view | Should have | ✅ Done | — |
| FR-25 | Outbound voice calls to real phone numbers triggered from agent case detail | Should have | ⏳ Planned | — |

## Non-Functional Requirements

| ID | Category | Requirement | Target | Status |
|---|---|---|---|---|
| NFR-01 | Performance | Bot response time (Claude API call + case creation) | < 5s perceived (streaming preferred) | ✅ Done |
| NFR-02 | Performance | Page load time for agent inbox | < 2s | ✅ Done |
| NFR-03 | Performance | Dashboard aggregation query | < 1s for up to 500 cases | ✅ Done |
| NFR-04 | Performance | Voice bot first response latency | < 1s (OpenAI Realtime WebRTC) | ✅ Done |
| NFR-05 | Reliability | Demo must work without internet except for AI API calls | All data local (SQLite) | ✅ Done |
| NFR-06 | Reliability | Both AI integrations have simulation fallback when keys are absent | Graceful degradation | ✅ Done |
| NFR-07 | Usability | Demo runnable by non-technical sales staff after initial setup | Single `npm run dev` or Railway URL | ✅ Done |
| NFR-08 | Security | AI API keys never exposed to the browser | Server-side only API routes | ✅ Done |
| NFR-09 | Maintainability | TypeScript strict mode enforced | `strict: true` in tsconfig | ✅ Done |
| NFR-10 | Portability | Adding a new company profile requires only a new JSON file | No code changes needed | ✅ Done |

## Acceptance Criteria (MVP)

- [x] A "customer" can go from channel selection → bot conversation → case creation → confirmation screen end-to-end
- [x] Bot correctly identifies intent categories using active company profile
- [x] Voice channel allows browser-to-AI call with real-time transcription and auto case creation
- [x] Agent inbox shows all seeded cases with correct SLA indicators (green/yellow/red)
- [x] Agent can open a case, reply, change status, and close it with a resolution note
- [x] Operational dashboard loads with real aggregated data
- [x] SLA timers are color-coded and visually accurate
- [x] Demo seeder populates 300 cases on every deploy
- [x] Company profile switch updates all AI prompts and branding in real time
- [x] All API routes validate input with Zod
- [x] No secrets committed to the repository
- [ ] Outbound voice calls to real phone numbers from agent console (planned)

## Requirements Change Log

| Date | Change | Reason | Impact |
|---|---|---|---|
| 2026-04-17 | Initial requirements defined from README | Project setup | All ADM artifacts |
| 2026-04-17 | Updated to reflect actual code in `claude/omnichannel-customer-ops-demo-w2Fu3` | Sync docs with built code | FR-20 to FR-24 added; FR-01 to FR-19 marked Done; NFR updated; tech stack corrected (Next 16, OpenAI Realtime, Railway) |
