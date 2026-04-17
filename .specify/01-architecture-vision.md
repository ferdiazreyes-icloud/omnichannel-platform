# 01 — Architecture Vision (TOGAF ADM: Phase A)

## Problem Statement

Arena Analytics needs a way to demonstrate its omnichannel customer operations platform to potential clients without building production infrastructure. Today, sales pitches rely on static decks and verbal descriptions — there is no interactive experience that lets prospects feel the platform end-to-end. This slows deal cycles and makes it harder to validate UX assumptions before investing in real development.

## Stakeholders

| Stakeholder | Role | Concern |
|---|---|---|
| Arena Analytics sales team | Presenter of the demo | Must be able to run the demo smoothly without technical setup |
| Potential clients (B2B) | Audience of the demo | Want to see a realistic, interactive journey — not a mockup |
| FerDi (product owner) | Builder and decision-maker | Fast iteration, no unnecessary complexity |
| End customers (simulated) | Actors in the demo journey | Realistic conversation experience with the bot |
| Agents / supervisors (simulated) | Actors in the demo journey | Believable case management and dashboard experience |

## Solution Overview

A fully functional demo web app built with Next.js that simulates the complete omnichannel customer operations journey: a customer starts a conversation on any channel (WhatsApp, SMS, web chat, Facebook Messenger), a real Claude-powered bot detects intent and creates a case, an agent works the case from a unified console, and supervisors monitor operations through live dashboards. All data is local (SQLite) and channels are simulated — no real integrations needed.

## Scope

**In scope (demo MVP):**
- Channel simulator: UI to pick WhatsApp / SMS / Web Chat / Facebook Messenger as origin
- Conversational bot: powered by real Claude API, detects intent, captures data, creates case
- Case confirmation: client sees case number and follow-up reference
- Agent inbox: filterable case list with SLA indicators (green/yellow/red)
- Case detail: full interaction timeline, customer context, status actions, internal notes
- Omnichannel reply: agent responds from one interface regardless of origin channel
- AI suggestions: Claude suggests responses based on case context
- Operational dashboard: real-time KPIs (open cases, SLA compliance, avg response time, volume by channel)
- Business dashboard: conversion rates, cost per case, top contact reasons, trends
- Alerts view: SLA at-risk cases, overloaded agents, volume anomalies
- Demo seeder: generates 200–500 realistic cases from the past 30 days

**Out of scope (future / production path):**
- Real WhatsApp / Meta API / Twilio integrations
- Authentication and multi-tenant support
- React Native / mobile app
- Microservices architecture
- Production deployment (Kubernetes, ECS)
- Real customer data or CRM/CDP integrations
- Encryption / compliance / data protection controls

## Value Proposition

This demo lets Arena Analytics show — not just tell — the platform's value in a live sales meeting. It validates the UX and flows before investing in production infrastructure, and provides a concrete reference point for client feedback. Building it now accelerates deal cycles and de-risks the product investment.
