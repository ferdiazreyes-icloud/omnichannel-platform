# Arena — Plataforma de Customer Operations Omnicanal (Demo)

## Qué es esto

Demo funcional de la **Plataforma de Customer Operations Omnicanal de Arena Analytics**. El objetivo es mostrar el journey completo: desde que un cliente inicia una conversación en cualquier canal hasta que su caso se resuelve, se cierra y se mide — todo trazable, con SLAs y dashboards operacionales.

**Este no es el producto de producción.** Es un demo interactivo diseñado para:

- Presentar la propuesta de valor a clientes potenciales
- Validar flujos y UX antes de invertir en infraestructura real
- Iterar rápido sobre la experiencia sin dependencias de terceros

---

## Arquitectura del demo

### Stack (simplificado para demo, no para producción)

| Capa                      | Tecnología                                  | Justificación                                              |
| ------------------------- | ------------------------------------------- | ---------------------------------------------------------- |
| **Frontend**              | Next.js 15+ (App Router, Server Components) | SSR, routing, API routes en un solo proyecto               |
| **UI**                    | Tailwind CSS + shadcn/ui                    | Componentes profesionales sin esfuerzo de diseño           |
| **Gráficas**              | Recharts                                    | Dashboards y KPIs                                          |
| **Backend**               | Next.js API Routes                          | Suficiente para el demo; evita microservicios innecesarios |
| **Base de datos**         | SQLite (via Prisma o Drizzle)               | Cero configuración, portable, datos persisten en archivo   |
| **Bot / AI**              | API de Anthropic (Claude)                   | Simulación del bot conversacional con inteligencia real    |
| **Estado en tiempo real** | Server-Sent Events (SSE)                    | Simula actualizaciones live sin WebSocket infrastructure   |
| **Mensajería simulada**   | Adapters con interfaces comunes             | WhatsApp, SMS, web chat simulados con la misma interfaz    |

### Decisiones explícitas para el demo

- **Monolito, no microservicios.** Un solo proyecto de Next.js maneja todo. En producción se separaría, pero para demo añade complejidad sin valor.
- **SQLite, no PostgreSQL + Redis.** No necesitas caché distribuida ni replicación para datos de demo. SQLite es más que suficiente y se levanta en cero segundos.
- **SSE, no WebSockets ni RabbitMQ.** Para simular actualizaciones en tiempo real del estado de casos, SSE es trivial de implementar y no requiere infraestructura adicional.
- **Sin React Native.** El demo es web. Si se necesita demostrar mobile, el dashboard con PWA support (responsive + manifest) es suficiente.

---

## Módulos del demo

### Fase 1 — Bot omnicanal + creación de caso (semana 1-2)

El punto de entrada del journey. Simula la experiencia del cliente.

**Pantallas:**

- **Simulador de canales**: interfaz tipo chat que permite elegir "WhatsApp", "SMS", "Web Chat", "Facebook Messenger" como canal de origen. El comportamiento del bot es el mismo; lo que cambia es el branding visual y los metadatos del caso.
- **Bot conversacional**: powered by Claude API. Identifica intención, captura datos mínimos (nombre, asunto, urgencia), y crea un caso.
- **Vista de confirmación del cliente**: el "cliente" ve que su caso fue creado y recibe un número de seguimiento.

**Modelo de datos clave:**

```
Caso (Ticket)
├── id (UUID)
├── canal_origen (whatsapp | sms | web | facebook | instagram | voz)
├── cliente_nombre
├── cliente_contacto
├── intencion (venta | soporte | cobranza | informacion)
├── categoria
├── prioridad (alta | media | baja)
├── estado (nuevo | asignado | en_curso | escalado | resuelto | cerrado)
├── sla_primera_respuesta (timestamp objetivo)
├── sla_resolucion (timestamp objetivo)
├── agente_asignado_id (FK)
├── created_at
├── updated_at
└── Interacciones[]
    ├── id
    ├── tipo (bot | agente | sistema | cliente)
    ├── contenido
    ├── canal
    └── timestamp
```

**Lógica de routing:**

```
Intención detectada por bot
  → Reglas de asignación:
      - Por categoría → pool de agentes especializados
      - Por prioridad → SLA diferenciado
      - Por carga → agente con menos casos activos
      - Fallback → cola general + alerta a supervisor
```

### Fase 2 — Consola del agente + ejecución (semana 2-3)

El corazón operativo. Donde el agente/vendedor trabaja los casos.

**Pantallas:**

- **Bandeja de casos**: lista filtrable por estado, prioridad, SLA (en riesgo / vencido / a tiempo). Vista tipo kanban opcional.
- **Detalle del caso**: timeline de interacciones, datos del cliente (simulando integración con CDP), acciones disponibles (responder, escalar, reasignar, cerrar).
- **Respuesta omnicanal**: el agente responde desde una sola interfaz sin importar el canal de origen. El sistema adapta el formato (largo de mensaje para SMS, rich media para WhatsApp, etc.).
- **Panel de contexto**: sidebar con historial del cliente, casos anteriores, datos relevantes (segmento, valor, productos).

**Funcionalidades clave:**

- Cambio de estado con validaciones (no puedes cerrar sin resolución documentada)
- Timer visual de SLA (countdown con color verde/amarillo/rojo)
- Notas internas (visibles solo para el equipo, no para el cliente)
- Sugerencias de AI: Claude sugiere respuestas basándose en el contexto del caso y el knowledge base

### Fase 3 — Dashboard operacional + gobernanza (semana 3-4)

La capa de visibilidad para supervisores y gerencia.

**Pantallas:**

- **Dashboard de operación en tiempo real**:
  - Casos abiertos por estado (nuevo / asignado / en curso / escalado)
  - SLA compliance rate (% de casos resueltos dentro del SLA)
  - Tiempo promedio de primera respuesta
  - Tiempo promedio de resolución
  - Casos por canal de origen
  - Carga por agente (casos activos)

- **Dashboard de negocio**:
  - Tasa de conversión por canal y por agente
  - Costo estimado por caso (basado en tiempo de atención)
  - Top motivos de contacto (treemap o bar chart)
  - Tendencia de volumen (línea temporal)
  - CSAT promedio (si se implementa encuesta de cierre)

- **Vista de alertas**:
  - SLAs en riesgo (casos próximos a vencer)
  - Agentes sobrecargados
  - Canales con tiempos anormales
  - Anomalías de volumen

**Datos para demo:**

Generar un seeder que cree 200-500 casos con datos realistas distribuidos en los últimos 30 días, con variación en canales, prioridades, tiempos de resolución y estados. Esto hace que los dashboards se vean vivos desde el primer momento.

---

## Estructura del proyecto

```
arena-omnicanal-demo/
├── README.md
├── package.json
├── next.config.js
├── tailwind.config.js
├── prisma/
│   ├── schema.prisma          # Modelo de datos
│   └── seed.ts                # Datos de demo
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Layout principal
│   │   ├── page.tsx           # Landing / selector de vista
│   │   ├── cliente/           # Simulador de canal + bot
│   │   │   └── page.tsx
│   │   ├── agente/            # Consola del agente
│   │   │   ├── page.tsx       # Bandeja de casos
│   │   │   └── [casoId]/
│   │   │       └── page.tsx   # Detalle del caso
│   │   ├── dashboard/         # Dashboards operacionales
│   │   │   ├── page.tsx       # Dashboard principal
│   │   │   └── alertas/
│   │   │       └── page.tsx
│   │   └── api/
│   │       ├── casos/         # CRUD de casos
│   │       ├── bot/           # Endpoint del bot (Claude API)
│   │       ├── routing/       # Motor de asignación
│   │       ├── metricas/      # Agregaciones para dashboards
│   │       └── sse/           # Server-Sent Events
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── chat/              # Componentes del bot/chat
│   │   ├── casos/             # Componentes de gestión de casos
│   │   └── dashboard/         # Widgets de dashboard
│   ├── lib/
│   │   ├── db.ts              # Cliente Prisma
│   │   ├── ai.ts              # Wrapper Claude API
│   │   ├── routing.ts         # Lógica de asignación
│   │   ├── sla.ts             # Cálculo y validación de SLAs
│   │   └── channels.ts        # Adaptadores de canales (simulados)
│   └── data/
│       ├── intents.json       # Catálogo de intenciones del bot
│       ├── agents.json        # Agentes de demo
│       └── rules.json         # Reglas de routing y SLAs
├── public/
│   └── icons/                 # Iconos de canales
└── .env.local                 # ANTHROPIC_API_KEY, etc.
```

---

## Setup

```bash
# Clonar e instalar
git clone <repo-url>
cd arena-omnicanal-demo
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tu ANTHROPIC_API_KEY

# Inicializar base de datos + datos de demo
npx prisma db push
npx prisma db seed

# Levantar en desarrollo
npm run dev
# → http://localhost:3000
```

### Variables de entorno

```env
# Requeridas
ANTHROPIC_API_KEY=sk-ant-...       # Para el bot conversacional
DATABASE_URL=file:./dev.db          # SQLite local

# Opcionales
DEMO_SEED_COUNT=300                 # Cantidad de casos a generar en seed
SLA_PRIMERA_RESPUESTA_MIN=15       # SLA default en minutos
SLA_RESOLUCION_HORAS=24            # SLA default en horas
```

---

## Convenciones para desarrollo con Claude Code

### Prompt strategy

Este proyecto está diseñado para construirse iterativamente con Claude Code. Cada fase se puede desarrollar en sesiones separadas.

**Orden sugerido de prompts:**

1. "Inicializa un proyecto Next.js 15 con App Router, Tailwind, shadcn/ui y Prisma con SQLite. Configura el schema según el modelo de datos del README."
2. "Crea el seeder que genere N casos realistas con datos variados de los últimos 30 días."
3. "Implementa el simulador de chat del cliente con selector de canal y bot que use la API de Claude para detectar intención y crear casos."
4. "Construye la bandeja de casos del agente con filtros, indicadores de SLA y vista de detalle con timeline de interacciones."
5. "Crea el dashboard operacional con las métricas definidas en el README usando Recharts."
6. "Agrega SSE para que la bandeja del agente y el dashboard se actualicen en tiempo real cuando el bot crea un caso nuevo."

### Reglas de código

- TypeScript estricto (`strict: true` en tsconfig)
- Componentes server por default; `'use client'` solo cuando se necesite interactividad
- API routes con validación de input (zod)
- Nombres de archivos y componentes en español donde sea descriptivo del dominio; inglés para utilidades genéricas
- Commits atómicos por feature/módulo

---

## Qué NO incluye este demo (y por qué)

| Ausencia                               | Razón                                                        |
| -------------------------------------- | ------------------------------------------------------------ |
| Integración real con WhatsApp/Meta API | Requiere cuenta Business verificada y configuración de webhooks. El demo simula los canales. |
| Autenticación / multi-tenant           | Complejidad sin valor para demo. Se asume un solo tenant y acceso libre. |
| Deployment a producción                | Es un demo local. Si se necesita deploy, Vercel + Turso (SQLite remoto) es la ruta más simple. |
| React Native / app mobile              | El dashboard responsive con PWA es suficiente para demostrar mobile. |
| Microservicios / message queues        | Arquitectura de producción. El demo es monolítico intencionalmente. |
| Encriptación / compliance              | No se manejan datos reales de clientes en el demo.           |

---

## Evolución hacia producción

Si el demo valida la propuesta y se decide construir el producto real, las decisiones arquitectónicas cambian:

```
Demo                          →  Producción
─────────────────────────────────────────────
Next.js monolito              →  Frontend (Next.js) + Backend (FastAPI o Actix)
SQLite                        →  PostgreSQL + Redis (caché/sesiones)
API Routes                    →  Microservicios con API Gateway
SSE                           →  WebSockets + RabbitMQ/SQS
Claude API directo            →  Orquestador de AI con fallbacks y rate limiting
Canales simulados             →  Integraciones reales (Meta API, Twilio, etc.)
Seed data                     →  CDP + integraciones CRM/ERP
Sin auth                      →  SSO + RBAC + multi-tenant
Deploy local                  →  Kubernetes / ECS + CI/CD
```

---

## Referencia del producto

Este demo implementa los conceptos descritos en el **Deck Comercial de Arena — Plataforma de Customer Operations Omnicanal**, específicamente:

- **Journey end-to-end** (slide 10): descubrimiento → conversación → caso → ejecución → cierre
- **Arquitectura de la plataforma** (slide 4): canales de cliente, servicios core, AI, automatización, operación, integraciones, monitoreo
- **Gobernanza operacional** (slide 11): escalamiento, QA, cadencia de reportes, gestión de incidentes
- **Métricas de éxito** (slide 12): conversión, abandono, tiempo de respuesta, resolución, CSAT

