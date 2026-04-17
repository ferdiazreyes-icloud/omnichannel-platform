# 01 — Architecture Vision (TOGAF ADM: Phase A)

## Problem Statement

Arena Analytics needs a way to demonstrate its omnichannel customer operations platform to potential clients without building production infrastructure. Today, sales pitches rely on static decks and verbal descriptions — there is no interactive experience that lets prospects feel the platform end-to-end. This slows deal cycles and makes it harder to validate UX assumptions before investing in real development.

An additional challenge: each prospect is in a different industry (telecom, banking, healthcare, real estate). The demo must feel relevant and personalized to each client without requiring a separate build per visit.

## Stakeholders

| Stakeholder | Role | Concern |
|---|---|---|
| Arena Analytics sales team | Presenter of the demo | Must be able to switch company profiles and run the demo without technical support |
| Potential clients (B2B) | Audience of the demo | Want to see a realistic, interactive journey using their own industry's language and context |
| FerDi (product owner) | Builder and decision-maker | Fast iteration, no unnecessary complexity, adaptable to new prospects |
| End customers (simulated) | Actors in the demo journey | Realistic bot conversation (text or voice) in the context of the prospect's business |
| Agents / supervisors (simulated) | Actors in the demo journey | Believable case management, SLA tracking, and dashboard experience |

> Note: the active company profile is selected at runtime from the home page — no login required. This means any sales rep can run any client profile without configuration.

## Solution Overview

A fully functional demo web app (Next.js monolith, deployed on Railway) that simulates the complete omnichannel customer operations journey. A configurable company profile system adapts the bot persona, product knowledge, and tone to any prospect in real time. The customer journey includes: text chat or voice call → bot detects intent → case created → agent works case → supervisor sees dashboards. All data is local (SQLite), channels are simulated, and a guided tour walks visitors through each screen.

## Scope

**In scope (implemented):**
- Company profile selector: 6 configurable clients (Megacable, JLL, MedTech, Banco, Ecommerce, Telco)
- Text channel simulator: WhatsApp / SMS / Web Chat / Facebook Messenger (simulated)
- Conversational text bot powered by Claude API with per-profile persona and knowledge
- Voice channel: browser-based inbound call with OpenAI Realtime API + WebRTC
- Case creation from both text and voice conversations
- Agent inbox: filterable by status, priority, SLA risk; list + kanban view
- Case detail: full interaction timeline, customer context, status transitions, internal notes
- Omnichannel reply from one interface
- AI response suggestions (Claude) for agents
- Operational dashboard: open cases, SLA compliance, response times, volume by channel, agent load
- Business dashboard: conversion, cost per case, top contact reasons, trends
- Alerts view: SLA at-risk, overloaded agents, anomalies
- Demo seeder: 300 realistic cases from the past 30 days (runs on build)
- Interactive guided tour (Krug UX principles) across all pages
- `/demo` Command Center page: end-to-end journey in a single view
- Production deployment on Railway via Docker

**Out of scope (future / production path):**
- Outbound voice calls to real phone numbers (planned next feature via Vapi.ai)
- Real WhatsApp / Meta API / Twilio integrations
- Authentication and multi-tenant support
- React Native / mobile app
- Microservices architecture
- Real customer data or CRM/CDP integrations
- Encryption / compliance / data protection controls

## Value Proposition

This demo lets Arena Analytics show — not just tell — the platform's value in a live sales meeting, personalized to each prospect's industry. It validates the UX and flows before investing in production infrastructure and provides a concrete reference point for client feedback. The guided tour and Command Center view reduce the presenter's cognitive load during demos.
