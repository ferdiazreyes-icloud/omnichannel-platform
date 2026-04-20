# 03 — Information Systems Architecture (TOGAF ADM: Phase C)

## Data Architecture

### Data Entities (actual Prisma schema)

| Entity | Description | Key Attributes |
|---|---|---|
| `Caso` | Central entity — a customer issue from creation to resolution | id (UUID), numeroCaso (unique string, e.g. CASO-ABC-XYZ), canalOrigen, clienteNombre, clienteContacto, intencion, categoria, prioridad, estado, resumen, slaPrimeraRespuesta, slaResolucion, primeraRespuestaAt, resolvedAt, csat (1-5), agenteId, createdAt, updatedAt |
| `Interaccion` | A single message or event within a case | id, tipo (bot/agente/sistema/cliente), contenido, canal, casoId, createdAt |
| `Agente` | A simulated agent | id, nombre, email, equipo (ventas/soporte/cobranza/general), activo, createdAt |

> Note: `casosActivos` is not stored — it is calculated at query time by counting cases with estado in (nuevo, asignado, en_curso).

### Data Relationships

```
Caso (1) ──── (N) Interaccion
Caso (N) ──── (1) Agente   [agenteId]
```

### Case States

```
nuevo → asignado → en_curso → [escalado] → resuelto → cerrado
```

### Intent Categories

`venta | soporte | cobranza | informacion`

### Channel Origins

`whatsapp | sms | web | facebook | instagram | voz`

### Priority Levels + SLA

| Priority | First Response | Resolution |
|---|---|---|
| alta | 8 min | 12 h |
| media | 15 min | 24 h |
| baja | 30 min | 48 h |

### Data Storage

- **Primary database:** SQLite via Prisma ORM — file `dev.db` at project root
- **Cache:** N/A
- **File storage:** N/A
- **Static config (runtime, not DB):**
  - `src/data/perfiles/*.json` — 6 company profiles (Megacable, JLL, MedTech, Banco, Ecommerce, Telco)
  - `src/data/agents.json` — demo agent seed data
  - `src/data/intents.json` — intent catalog
  - `src/data/rules.json` — routing rules + SLA configuration

---

## Application Architecture

### Components

| Component | Responsibility | Communicates With |
|---|---|---|
| Next.js App Router (frontend) | All UI: home + profile selector, channel simulator, voice page, agent console, dashboards, tour | API Routes (HTTP), SSE endpoint |
| Next.js API Routes (backend) | Business logic, data access, AI calls, routing engine, SLA calculations | Prisma (SQLite), Anthropic API, OpenAI API, SSE |
| Prisma ORM | Database abstraction, schema migrations, seeder | SQLite file |
| Profile System (`src/lib/perfiles.ts`) | In-memory registry of 6 company JSONs; exposes active profile + system prompt generator | — |
| Routing Engine (`src/lib/routing.ts`) | Assigns cases by intent→team, load balancing, fallback to general | Prisma |
| SLA Engine (`src/lib/sla.ts`) | Calculates deadlines, evaluates compliance (a_tiempo/en_riesgo/vencido), countdown | date-fns |
| Channel Adapters (`src/lib/channels.ts`) | Normalizes messages across simulated channels | — |
| AI Wrapper — Text (`src/lib/ai.ts`) | `chatWithBot()`: calls Claude for text conversations + intent detection (including callback requests). `sugerirRespuesta()`: agent response drafts. `resumirConversacion()`: generates ≤150-word Spanish summary of a chat for the voice agent | Anthropic Claude API |
| Outbound Callback (`src/lib/vapi.ts` + `src/app/api/callback/route.ts`) | Builds the Vapi outbound payload (hardcoded for telco profile), creates the case, logs system interactions, and POSTs to Exitus. Handles profile validation and upstream failures with fallback | Exitus Comms (Vapi) |
| Voice Session Endpoint (`src/app/api/voice/session/route.ts`) | Generates ephemeral OpenAI Realtime token; injects active profile as system prompt | OpenAI Realtime API |
| WebRTC Hook (`src/hooks/use-webrtc.ts`) | Manages full WebRTC lifecycle: peer connection, audio I/O, SDP exchange, transcript extraction | OpenAI Realtime API (SDP), Browser WebRTC |
| SSE Endpoint (`src/app/api/sse/route.ts`) | Pushes real-time updates to agent inbox and dashboard | Prisma |
| Demo Seeder (`scripts/seed.js`) | Generates 300 realistic cases; runs automatically on `postbuild` | Prisma |

### Pages

| Route | Description |
|---|---|
| `/` | Home: company profile selector + navigation to all demo views |
| `/cliente` | Text channel simulator + bot conversation |
| `/voz` | Voice channel: browser call with OpenAI Realtime + transcript |
| `/agente` | Agent inbox: case list with filters + SLA indicators |
| `/agente/[casoId]` | Case detail: timeline + reply + status actions + AI suggestions |
| `/dashboard` | Operational + business dashboards (Recharts) |
| `/dashboard/alertas` | SLA at-risk + overloaded agents + anomalies |
| `/demo` | Command Center: end-to-end journey in one view |

### External Integrations

| System | Purpose | Protocol | Used By |
|---|---|---|---|
| Anthropic Claude API (`claude-sonnet-4-20250514`) | Text bot conversations + agent response suggestions + chat summaries for callback | REST (HTTPS) | `src/lib/ai.ts` |
| OpenAI Realtime API (`gpt-4o-mini-realtime-preview`) | Voice bot: low-latency audio streaming, VAD, transcription | WebRTC + REST (token) | `src/hooks/use-webrtc.ts`, `src/app/api/voice/session/route.ts` |
| Exitus Comms (Vapi) — `VAPI_OUTBOUND_URL` | Outbound callback trigger. Demo hardcodes `from_number: "3341700562"` and `destination: "demo-telco-dev"` (telco profile only). No auth. Fire-and-forget: no webhook back — Vapi manages the call externally. | REST (HTTPS) | `src/lib/vapi.ts`, `src/app/api/callback/route.ts` |

> Both integrations have simulation fallbacks: if the API key is absent, the system returns scripted responses and marks itself as `simulation: true`.
