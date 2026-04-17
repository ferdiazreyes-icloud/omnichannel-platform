# Requirements Management (TOGAF ADM: Continuous)

> Living document. Updated throughout the project lifecycle as new requirements emerge or existing ones change.

## Functional Requirements

| ID | Requirement | Priority | Status | Source |
|---|---|---|---|---|
| FR-01 | Customer can select a channel (WhatsApp, SMS, Web Chat, Facebook) and start a bot conversation | Must have | Pending | 01-architecture-vision |
| FR-02 | Bot detects intent (venta/soporte/cobranza/informacion) using Claude API | Must have | Pending | 01-architecture-vision |
| FR-03 | Bot captures minimum data: customer name, subject, urgency | Must have | Pending | 02-business-architecture |
| FR-04 | Bot creates a case with auto-assigned priority and SLA timestamps | Must have | Pending | 02-business-architecture |
| FR-05 | Customer sees a case confirmation screen with case number and expected response time | Must have | Pending | 02-business-architecture |
| FR-06 | Agent can view the case inbox filtered by status, priority, and SLA risk | Must have | Pending | 01-architecture-vision |
| FR-07 | Agent can open a case and view the full interaction timeline | Must have | Pending | 02-business-architecture |
| FR-08 | Agent can reply to a customer from a single interface regardless of origin channel | Must have | Pending | 01-architecture-vision |
| FR-09 | Agent can add internal notes visible only to the team | Must have | Pending | 02-business-architecture |
| FR-10 | Agent can change case status with validation (cannot close without documented resolution) | Must have | Pending | 02-business-architecture |
| FR-11 | Agent can escalate or reassign a case | Must have | Pending | 02-business-architecture |
| FR-12 | SLA countdown timer is visible on every case (green/yellow/red) | Must have | Pending | 01-architecture-vision |
| FR-13 | Claude suggests response drafts to the agent based on case context | Should have | Pending | 01-architecture-vision |
| FR-14 | Routing engine auto-assigns cases: category → agent pool, priority → SLA, load balancing | Must have | Pending | 02-business-architecture |
| FR-15 | Operational dashboard shows: open cases by status, SLA compliance %, avg first-response time, avg resolution time, volume by channel, agent load | Must have | Pending | 01-architecture-vision |
| FR-16 | Business dashboard shows: conversion by channel/agent, cost per case, top contact reasons, volume trends | Should have | Pending | 01-architecture-vision |
| FR-17 | Alerts view shows: SLA at-risk cases, overloaded agents, volume anomalies | Should have | Pending | 01-architecture-vision |
| FR-18 | Dashboard and inbox update in real time via SSE when new cases arrive or statuses change | Should have | Pending | 01-architecture-vision |
| FR-19 | Demo seeder generates 200–500 realistic cases from the last 30 days with varied channels, priorities, and resolution times | Must have | Pending | README |

## Non-Functional Requirements

| ID | Category | Requirement | Target |
|---|---|---|---|
| NFR-01 | Performance | Bot response time (Claude API call + case creation) | < 5s perceived (streaming preferred) |
| NFR-02 | Performance | Page load time for agent inbox | < 2s |
| NFR-03 | Performance | Dashboard aggregation query | < 1s for up to 500 cases |
| NFR-04 | Reliability | Demo must run without internet except for Claude API | All data local (SQLite) |
| NFR-05 | Usability | Demo must be runnable by non-technical sales staff | Single command: `npm run dev` after setup |
| NFR-06 | Security | ANTHROPIC_API_KEY must never be exposed to the browser | API routes handle all Claude calls server-side |
| NFR-07 | Maintainability | TypeScript strict mode enforced | `strict: true` in tsconfig |
| NFR-08 | Portability | Demo runs on macOS and Windows without modification | SQLite file-based, no Docker required |

## Acceptance Criteria (MVP)

- [ ] A "customer" can go from channel selection → bot conversation → case creation → confirmation screen end-to-end
- [ ] Bot correctly identifies at least 3 of 4 intent categories in a live demo
- [ ] Agent inbox shows all seeded cases with correct SLA indicators
- [ ] Agent can open a case, reply, change status, and close it with a resolution note
- [ ] Operational dashboard loads with real aggregated data from the seeded cases
- [ ] SLA timers are color-coded and visually accurate
- [ ] Demo seeder populates 200+ cases in under 30 seconds
- [ ] All API routes validate input with Zod and return proper error codes
- [ ] No secrets are committed to the repository

## Requirements Change Log

| Date | Change | Reason | Impact |
|---|---|---|---|
| 2026-04-17 | Initial requirements defined from README | Project setup | All ADM artifacts |
