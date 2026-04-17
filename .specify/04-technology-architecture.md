# 04 — Technology Architecture (TOGAF ADM: Phase D)

## Technology Stack

| Layer | Technology | Version | Justification |
|---|---|---|---|
| **Framework** | Next.js (App Router) | 15+ | SSR, routing, and API routes in a single project — no separate backend needed for a demo |
| **Language** | TypeScript | 5+ | Strict mode (`strict: true`). Type safety without overhead. |
| **UI** | Tailwind CSS | 3+ | Utility-first styling, fast iteration, no custom CSS needed |
| **Components** | shadcn/ui | Latest | Professional components out of the box — no design effort required |
| **Charts** | Recharts | Latest | Simple, composable chart library for dashboards and KPIs |
| **ORM** | Prisma | Latest | Zero-config schema management, type-safe queries, built-in seeder support |
| **Database** | SQLite | — | Single file, zero setup, portable. Sufficient for demo data volume. |
| **AI** | Anthropic Claude API | Latest | Real conversational intelligence for bot and agent suggestions |
| **Real-time** | Server-Sent Events (SSE) | — | Simulates live updates without WebSocket infrastructure |
| **Validation** | Zod | Latest | Input validation on all API routes |
| **Testing** | Jest + React Testing Library | — | Unit + integration tests |
| **Package manager** | npm | — | Default, no special tooling needed |

## Infrastructure

### Environments

| Environment | Purpose | URL/Location |
|---|---|---|
| Local | Development and demo | `http://localhost:3000` |
| Staging | N/A for this project | — |
| Production (optional) | If demo needs to be shared remotely | Vercel + Turso (SQLite remote) |

### Deployment

**Default (local):**
```bash
npm install
cp .env.example .env.local   # fill in ANTHROPIC_API_KEY
npx prisma db push
npx prisma db seed
npm run dev
# → http://localhost:3000
```

**Optional (remote demo):**
- Deploy to Vercel (zero config for Next.js)
- Replace SQLite with Turso (hosted SQLite, minimal migration)
- Set env vars in Vercel dashboard

### Project Structure

```
omnichannel-platform/
├── prisma/
│   ├── schema.prisma          # Data model
│   └── seed.ts                # Demo data seeder
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Landing / view selector
│   │   ├── cliente/           # Channel simulator + bot
│   │   ├── agente/            # Agent console
│   │   │   └── [casoId]/      # Case detail
│   │   ├── dashboard/         # Operational dashboards
│   │   │   └── alertas/
│   │   └── api/
│   │       ├── casos/         # Case CRUD
│   │       ├── bot/           # Bot endpoint (Claude API)
│   │       ├── routing/       # Assignment engine
│   │       ├── metricas/      # Dashboard aggregations
│   │       └── sse/           # Server-Sent Events
│   ├── components/
│   │   ├── ui/                # shadcn/ui base components
│   │   ├── chat/              # Bot/chat components
│   │   ├── casos/             # Case management components
│   │   └── dashboard/         # Dashboard widgets
│   ├── lib/
│   │   ├── db.ts              # Prisma client
│   │   ├── ai.ts              # Claude API wrapper
│   │   ├── routing.ts         # Case assignment logic
│   │   ├── sla.ts             # SLA calculation and validation
│   │   └── channels.ts        # Simulated channel adapters
│   └── data/
│       ├── intents.json       # Bot intent catalog
│       ├── agents.json        # Demo agents
│       └── rules.json         # Routing rules and SLA config
└── public/
    └── icons/                 # Channel icons
```

## Security Architecture

- **Authentication:** None — demo is single-tenant, open access
- **Authorization:** None — all routes are public
- **Secrets management:** `.env.local` locally (gitignored); Vercel env vars if deployed
- **HTTPS:** Not enforced locally; Vercel enforces it automatically on deploy
- **API key exposure:** `ANTHROPIC_API_KEY` is server-side only — never exposed to the browser (API routes handle all Claude calls)
