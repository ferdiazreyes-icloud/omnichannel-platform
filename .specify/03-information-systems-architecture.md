# 03 — Information Systems Architecture (TOGAF ADM: Phase C)

## Data Architecture

### Data Entities

| Entity | Description | Key Attributes |
|---|---|---|
| `Caso` (Ticket) | Central entity — a customer issue from creation to resolution | id (UUID), canal_origen, cliente_nombre, cliente_contacto, intencion, categoria, prioridad, estado, sla_primera_respuesta, sla_resolucion, agente_asignado_id, created_at, updated_at |
| `Interaccion` | A single message or event within a case (bot, agent, customer, system) | id, caso_id, tipo (bot/agente/sistema/cliente), contenido, canal, timestamp |
| `Agente` | A simulated agent with capacity and specialty | id, nombre, email, especialidad, casos_activos, disponible |
| `ReglasRouting` | Configuration for routing logic (category → agent pool, priority → SLA) | Stored in `data/rules.json` |

### Data Relationships

```
Caso (1) ──── (N) Interaccion
Caso (N) ──── (1) Agente   [agente_asignado_id]
```

- One case has many interactions (the full conversation + action history)
- Many cases can be assigned to one agent

### Data Storage

- **Primary database:** SQLite via Prisma ORM — single file `dev.db` at project root
- **Cache:** N/A — no caching layer for this demo
- **File storage:** N/A — no file uploads in scope
- **Static config:** `src/data/intents.json` (bot intent catalog), `src/data/agents.json` (demo agents), `src/data/rules.json` (routing rules and SLA config)

### Case States

```
nuevo → asignado → en_curso → [escalado] → resuelto → cerrado
```

- `nuevo`: just created by bot, pending routing
- `asignado`: routing engine assigned an agent
- `en_curso`: agent has opened and is working the case
- `escalado`: moved to a higher-tier agent or supervisor
- `resuelto`: agent documented resolution
- `cerrado`: final state, no further action allowed

### Intent Categories

`venta | soporte | cobranza | informacion`

### Channel Origins

`whatsapp | sms | web | facebook | instagram | voz`

### Priority Levels

`alta | media | baja`

---

## Application Architecture

### Components

| Component | Responsibility | Communicates With |
|---|---|---|
| Next.js App Router (frontend) | All UI: channel simulator, agent console, dashboards | API Routes (HTTP), SSE endpoint |
| Next.js API Routes (backend) | Business logic, data access, routing engine, SLA calculations | Prisma (SQLite), Claude API, SSE |
| Prisma ORM | Database abstraction, schema management, seed | SQLite file |
| Routing Engine (`src/lib/routing.ts`) | Assigns cases to agents based on category, priority, and load | Prisma |
| SLA Engine (`src/lib/sla.ts`) | Calculates deadlines, evaluates compliance, flags at-risk cases | Prisma |
| Channel Adapters (`src/lib/channels.ts`) | Normalizes messages to/from any simulated channel | — |
| AI Wrapper (`src/lib/ai.ts`) | Wraps Claude API: intent detection, response suggestions | Anthropic API |
| SSE Endpoint (`src/app/api/sse/`) | Pushes real-time updates to the agent inbox and dashboard | Prisma, client browsers |
| Demo Seeder (`prisma/seed.ts`) | Generates 200–500 realistic cases with varied data | Prisma |

### External Integrations

| System | Purpose | Protocol | Notes |
|---|---|---|---|
| Anthropic Claude API | Bot conversations + agent response suggestions | REST (HTTPS) | Requires `ANTHROPIC_API_KEY` env var. Model: claude-sonnet or similar. |

> All other channels (WhatsApp, SMS, Facebook, Instagram, Voice) are simulated locally. No external integration is required for the demo.
