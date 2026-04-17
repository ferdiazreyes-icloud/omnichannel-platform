# 02 — Business Architecture (TOGAF ADM: Phase B)

## User Flows

### Flow 1: Customer — Initiates contact via any channel
1. Customer opens the channel simulator and selects a channel (WhatsApp, SMS, Web Chat, Facebook Messenger)
2. Customer starts a conversation with the bot
3. Bot (Claude API) greets, detects intent, and asks clarifying questions (name, subject, urgency)
4. Bot creates a case in the system with auto-assigned priority and SLA
5. Customer sees a confirmation screen with their case number and expected response time

### Flow 2: Agent — Works a case from the inbox
1. Agent opens the case inbox and sees all active cases filtered by status, priority, and SLA risk
2. Agent opens a case and reviews the full interaction timeline (bot transcript + any prior messages)
3. Agent sees customer context in the sidebar (segment, prior cases, relevant data)
4. Agent types a response; the system adapts format to the origin channel (SMS length limit, WhatsApp rich media, etc.)
5. Agent can add internal notes (not visible to customer), escalate, reassign, or close the case
6. Agent cannot close a case without documenting a resolution
7. SLA countdown timer is always visible (green → yellow → red as deadline approaches)
8. Claude suggests response drafts based on case context and knowledge base

### Flow 3: Supervisor — Monitors operations in real time
1. Supervisor opens the operational dashboard and sees live KPIs: open cases by status, SLA compliance rate, avg first-response time, avg resolution time, volume by channel, agent load
2. Supervisor opens the business dashboard: conversion rate by channel and agent, cost per case, top contact reasons, volume trends
3. Supervisor checks the alerts view: cases close to SLA breach, overloaded agents, channel anomalies
4. Dashboard updates in real time via SSE as new cases arrive or statuses change

### Flow 4: Routing — System auto-assigns cases
1. Bot detects intent and category
2. Routing engine applies rules: category → specialist agent pool, priority → SLA tier, load balancing → agent with fewest active cases
3. Fallback: general queue + supervisor alert if no agent matches

## Use Cases

| # | Use Case | Actor | Description |
|---|---|---|---|
| UC-01 | Select channel and start chat | Customer | Customer picks a channel and begins a bot conversation |
| UC-02 | Bot detects intent and creates case | Bot (Claude) | Bot identifies intent (sale, support, collections, info), captures minimal data, and creates a case with priority + SLA |
| UC-03 | View case confirmation | Customer | Customer sees case number and expected response time |
| UC-04 | View and filter case inbox | Agent | Agent sees all cases, filterable by status, priority, SLA risk |
| UC-05 | Open and work a case | Agent | Agent reviews timeline, context, and takes action on a case |
| UC-06 | Reply omnichannel | Agent | Agent sends a response adapted to the origin channel format |
| UC-07 | Add internal note | Agent | Agent adds a note visible only to the team |
| UC-08 | Change case status | Agent | Agent moves case through states with validation (can't close without resolution) |
| UC-09 | View AI response suggestion | Agent | Claude suggests a draft response based on case context |
| UC-10 | View operational dashboard | Supervisor | Real-time KPIs on case volume, SLA compliance, agent load |
| UC-11 | View business dashboard | Supervisor | Conversion rates, cost per case, contact reason trends |
| UC-12 | View alerts | Supervisor | Cases at SLA risk, overloaded agents, volume anomalies |

## Business Rules

- A case cannot be closed without a documented resolution
- SLA timers start at case creation: first-response SLA (default 15 min), resolution SLA (default 24 h)
- SLA tiers are determined by case priority: high → shorter SLA, low → longer SLA
- Routing priority: category match → load balance → fallback to general queue
- Agents cannot see internal notes from other cases — notes are scoped to the case
- Bot always creates a case, even if the conversation is incomplete (with partial data flagged)
- Channel format rules: SMS responses ≤ 160 chars; WhatsApp allows rich media; Web and Facebook have no format constraint

## Business Processes

This demo supports three core business processes:

1. **Inbound contact handling:** Any customer message, regardless of channel, is captured, classified, and routed to the right agent pool within SLA. The bot handles the first touch autonomously.

2. **Case lifecycle management:** Every interaction is tracked from creation to resolution. Agents work from a single interface; the system abstracts channel differences. Status transitions have validation rules to ensure data quality.

3. **Operational governance:** Supervisors have real-time visibility into team performance, SLA compliance, and channel health. Alerts surface problems before they breach SLAs.
