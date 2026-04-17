# 02 — Business Architecture (TOGAF ADM: Phase B)

## User Flows

### Flow 1: Sales rep — Sets up the demo for a specific client
1. Sales rep opens the home page
2. Selects the company profile matching the prospect (e.g., "Megacable" for a telecom visit)
3. All bot personas, product knowledge, and greetings update instantly — no reload needed
4. Sales rep navigates to any view; everything reflects the selected client

### Flow 2: Customer (text) — Initiates contact via any channel
1. Sales rep opens the channel simulator and selects a channel (WhatsApp, SMS, Web Chat, Facebook Messenger)
2. Customer starts a conversation with the text bot (Claude)
3. Bot detects intent, asks clarifying questions (name, subject, urgency), using the active company's tone and product knowledge
4. Bot creates a case with auto-assigned priority and SLA
5. Customer sees a confirmation screen with case number and expected response time

### Flow 3: Customer (voice) — Calls via the voice channel
1. Sales rep opens `/voz`
2. Clicks "Iniciar llamada" — browser connects via WebRTC to OpenAI Realtime API
3. Customer speaks naturally; bot responds in real time with the active company's voice persona
4. Transcription appears on screen in real time
5. After the call ends, the transcript is saved as a case automatically

### Flow 4: Agent — Works a case from the inbox
1. Agent opens the case inbox and sees all active cases filtered by status, priority, and SLA risk (green/yellow/red)
2. Agent toggles between list and kanban view
3. Agent opens a case and reviews the full interaction timeline (bot transcript + interactions)
4. Agent sees customer context in the sidebar
5. Agent types a response (Claude suggests a draft); the system adapts format to origin channel
6. Agent can add internal notes, escalate, reassign, or close the case
7. Agent cannot close a case without documenting a resolution
8. Dashboard and inbox update in real time via SSE

### Flow 5: Supervisor — Monitors operations in real time
1. Supervisor opens the operational dashboard (Operación tab): open cases by status, SLA compliance %, avg response time, avg resolution time, volume by channel, agent load
2. Supervisor opens the business dashboard (Negocio tab): conversion by channel/agent, cost per case, top contact reasons, trends
3. Supervisor checks the alerts view: cases close to SLA breach, overloaded agents, volume anomalies
4. Dashboard auto-refreshes every 10 seconds

### Flow 6: Routing — System auto-assigns cases
1. Bot detects intent and category
2. Routing engine applies rules: intent → specialist team (ventas/soporte/cobranza/general), priority → SLA tier, load balancing → agent with fewest active cases
3. Fallback: general pool if no specialist available

### Flow 7: Guided tour — New visitor gets oriented
1. Visitor opens any page for the first time
2. Interactive tour overlay highlights key elements with explanations (Krug UX principles)
3. Visitor can follow the tour or dismiss it

## Use Cases

| # | Use Case | Actor | Description |
|---|---|---|---|
| UC-01 | Select company profile | Sales rep | Pick from 6 available clients; all AI prompts and branding update instantly |
| UC-02 | Select channel and start text chat | Customer | Picks a channel and begins a bot conversation |
| UC-03 | Bot detects intent and creates case (text) | Bot (Claude) | Identifies intent, captures name + contact + subject, creates case with priority + SLA |
| UC-04 | Start voice call | Customer | Opens /voz, clicks "Iniciar llamada", speaks with AI voice bot |
| UC-05 | Bot creates case from transcript (voice) | Bot (OpenAI) | After call ends, transcript is saved as case + interactions |
| UC-06 | View case confirmation | Customer | Sees case number and expected response time |
| UC-07 | View and filter case inbox | Agent | Sees all cases, filterable by status, priority, SLA risk; list or kanban |
| UC-08 | Open and work a case | Agent | Reviews timeline and context, takes action |
| UC-09 | Reply omnichannel | Agent | Sends response adapted to origin channel format |
| UC-10 | Add internal note | Agent | Note visible only to team |
| UC-11 | Change case status | Agent | Moves case through states with validation |
| UC-12 | View AI response suggestion | Agent | Claude suggests a draft based on case context |
| UC-13 | View operational dashboard | Supervisor | Real-time KPIs on volume, SLA, agent load |
| UC-14 | View business dashboard | Supervisor | Conversion, cost per case, contact reason trends |
| UC-15 | View alerts | Supervisor | SLA at-risk, overloaded agents, anomalies |
| UC-16 | Follow guided tour | Any | Interactive overlay explains each page |
| UC-17 | View Command Center demo | Any | End-to-end journey in a single `/demo` page |

## Business Rules

- A case cannot be closed without a documented resolution
- SLA timers start at case creation: first-response SLA and resolution SLA are set by priority tier
  - Alta: 8 min first response / 12 h resolution
  - Media: 15 min / 24 h
  - Baja: 30 min / 48 h
- Routing: intent → team (venta→ventas, soporte→soporte, cobranza→cobranza, informacion→general)
- Load balancing: agent with fewest active cases (estado: nuevo/asignado/en_curso) gets the case
- Fallback routing: if no specialist available, assign to any active agent
- Escalation alert: cases escalated after SLA breach (configurable threshold: 5 min past due)
- Agent overload alert: triggered at 12+ active cases (hard cap at 15)
- SMS responses are format-constrained (shorter); WhatsApp supports rich text

## Business Processes

1. **Inbound contact handling (text):** Customer message → Claude bot → intent detection → case creation → routing → agent assignment within SLA
2. **Inbound contact handling (voice):** Browser call → OpenAI Realtime → conversation → auto case creation from transcript → routing
3. **Case lifecycle management:** Creation → assignment → working → (escalation) → resolution → closure. All transitions validated.
4. **Operational governance:** Real-time dashboards + alert rules surface SLA risk and agent overload before they become incidents.
5. **Demo personalization:** Profile selection → AI system prompts updated → all channels reflect the prospect's brand and knowledge base.
