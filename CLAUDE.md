# ⛔ STOP — READ THIS ENTIRE FILE BEFORE DOING ANYTHING

Ruleset for this project. NON-NEGOTIABLE.

**Language:** Communicate with FerDi in Spanish. Code, comments, commits, and docs stay in English.

**User context:** FerDi is a product/business person, NOT a developer. Use clear, non-technical language. Explain jargon before using it.

---

## Project Context

- **Name:** Arena — Plataforma de Customer Operations Omnicanal (Demo)
- **Description:** Demo interactiva del journey omnicanal completo: bot conversacional → caso → consola del agente → dashboard operacional
- **Client/Owner:** Arena Analytics / FerDi
- **ADM artifacts:** `.specify/` — read these for full architecture context

---

## 🚫 What You Must NEVER Do — Critical Failures

1. **NEVER start coding without completing at least Phase 1 of the relevant questionnaire** (see below)
2. **NEVER implement without a spec or clear task description** — ask first
3. **NEVER skip tests** — tests are mandatory, write them AS you implement
4. **NEVER say a task is "done" without completing the Closure Protocol** (see below)
5. **NEVER update `.specify/00-principles.md`** unless FerDi explicitly asks (it's immutable)
6. **NEVER assume or guess** — if something is unclear, ask before implementing
7. **NEVER commit secrets, API keys, passwords, or `.env` files**
8. **NEVER push to `main` without FerDi's VOBO** — work on a feature branch, merge to main only after approval
9. **NEVER modify infrastructure (Docker, CI/CD, Makefile) without explicit approval**
10. **NEVER create overly complex solutions** — prefer MVPs that work

---

## 🔄 Session Start Protocol

BEFORE doing anything:

1. `git pull` — sync any remote changes (e.g., work done from another device)
2. Read this `CLAUDE.md`
3. Read `README.md`
4. Read `.specify/` files: `00-principles.md`, `01-architecture-vision.md`, and any other ADM artifacts that exist
5. Read `tasks.md` if it exists
6. Summarize: "He leído el estado actual del proyecto. [2-3 sentences]. ¿En qué quieres que trabaje?"

If any files are missing, tell FerDi which ones and ask if he wants them created.

---

## ✅ Closure Protocol — MANDATORY After Every Task

**You CANNOT say a task is complete until ALL of these are done.** This is rule #4 above — skipping this is a critical failure.

1. All tests pass
2. No secrets or `.env` files are staged
3. `README.md` is updated to reflect what changed (functionality, version, pending items)
4. `.specify/` files are consistent with what was built
5. Code follows project conventions
6. Commit messages follow conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`)
7. Docker build succeeds (if applicable)

**After completing steps 1-7, tell FerDi:** "Tarea completada. Actualicé [list what was updated]. Tests pasan. ¿VOBO para merge a main?"

**After FerDi gives VOBO (approval), automatically:**
8. Merge feature branch → main
9. Push to main
10. Confirm: "Cambios en main. Ya se están desplegando."

**FerDi does NOT need to ask for the merge** — his approval IS the merge order.

---

## 🌿 Branch Rules

- **One active branch at a time.** Finish and merge before starting the next task.
- **Branch naming:** `feature/descriptive-name`, `bugfix/descriptive-name`, `hotfix/descriptive-name`
- **All work happens on the feature branch.** Main only receives merges after VOBO.
- **Hotfix exception:** urgent fixes can go on a `hotfix/` branch and merge to main with VOBO, pausing the current feature branch.

---

## Philosophy

Spec-driven, AI-first development aligned with TOGAF ADM. Nothing gets implemented without a clear spec. Progressive versioning: V0 (manual) → V1 (scripts) → V2 (automation). Prefer MVPs over perfect architectures.

---

## 📋 Questionnaires — MANDATORY Before Coding

| Trigger | Questionnaire |
|---|---|
| New service/project/app | **A: New Service** |
| New feature / "add X" | **B: New Feature** |
| Bug / "this is broken" | **C: Bug Fix** |
| Typo, rename, formatting | **D: Quick Task** (no questionnaire) |

### A: New Service (TOGAF ADM aligned)

**Phase 1 — Architecture Vision (ask FIRST):**
1. ¿Para qué es este servicio? ¿Qué problema resuelve?
2. ¿Quién lo va a usar? (usuarios finales, equipo interno, otros servicios)
3. ¿Cuáles son las 2-3 cosas que DEBE hacer sí o sí para ser útil?
4. ¿Hay restricciones duras? (rendimiento, seguridad, cumplimiento, presupuesto)
5. ¿Hay principios no negociables para este proyecto?

**Phase 2 — Business & Requirements (after Phase 1):**
6. ¿Cuáles son los flujos principales desde la perspectiva del usuario?
7. ¿Qué entra en el MVP y qué NO?
8. ¿Criterios de aceptación para saber que el MVP está listo?

**Phase 3 — Architecture & Technology (after Phase 2):**
9. ¿Necesita comunicarse con otros servicios o APIs externas?
10. ¿Qué datos maneja y cómo se relacionan?
11. ¿Preferencia de tech stack, o quieres que evalúe alternativas?
12. ¿Este proyecto reemplaza o migra algo existente? → Si SÍ: se crea `06-migration-planning.md`

**Phase 4 — Confirm and generate (after Phase 3):**
13. Present summary of ALL `.specify/` ADM artifacts to be generated
14. "¿Se ve bien? ¿Ajusto algo antes de empezar a construir?"

ONLY after approval: generate `.specify/` ADM files, project structure, Docker setup, Makefile, `.env.example`, health check, basic tests, and initial README.

**ADM artifacts generated (standard set):**
```
.specify/
├── 00-principles.md                        → Immutable principles & constraints
├── 01-architecture-vision.md               → Problem, stakeholders, scope, value
├── 02-business-architecture.md             → User flows, business processes, use cases
├── 03-information-systems-architecture.md  → Data model, integrations, app components
├── 04-technology-architecture.md           → Stack, infrastructure, deployment
├── 05-opportunities-and-solutions.md       → Alternatives evaluated, build/buy/reuse decisions
├── 06-migration-planning.md               → ONLY if migrating from something existing
└── requirements.md                         → Functional & non-functional requirements (living document)
```

### B: New Feature

**Phase 1 — Understand (ask FIRST):**
1. ¿Qué problema resuelve? ¿Qué pasa hoy sin ella?
2. ¿Quién se beneficia?
3. ¿Cómo debería funcionar desde la perspectiva del usuario?

**Phase 2 — Acceptance (after Phase 1):**
4. ¿Criterios de aceptación?
5. ¿Casos borde o errores a manejar?
6. ¿Afecta otras partes del sistema?

After answers: read `.specify/*` files, present `tasks.md` for approval BEFORE coding. Update `requirements.md` with new requirements.

### C: Bug Fix

**Phase 1 — Understand (ask FIRST):**
1. ¿Qué está pasando que no debería?
2. ¿Qué DEBERÍA pasar?
3. ¿Cuándo empezó? ¿Cambió algo?

**Phase 2 — Investigate (then report):**
4. Read logs/Sentry if available, identify root cause
5. "El problema es X por causa de Y. Propongo Z. ¿Procedo?"

ONLY after approval: regression test first → fix → verify tests pass.

### D: Quick Task

- Describe the change in one sentence
- "¿Procedo?" — wait for confirmation
- Still run tests after

---

## Code Conventions

### JavaScript / TypeScript
- ESLint + Prettier, TypeScript strict mode (`strict: true`)
- Testing: Jest or Vitest
- Components server by default; `'use client'` only when interactivity is needed
- API routes with input validation (zod)
- Domain-specific filenames in Spanish; generic utilities in English

### General
- Commands: use Makefile for standard commands: `make up`, `make down`, `make test`, `make logs`

---

## Testing

- Minimum: unit tests for business logic + integration tests for API endpoints
- Run with: `make test`
- NEVER mark a task as done if tests are failing

---

## Security

- `.gitignore` must include `.env*` (except `.env.example`)
- Every project needs `.env.example` with placeholders
- New env vars → update `.env.example` first, tell FerDi what to set
- Before every commit: verify no secrets are staged

---

## PR Standards

Every PR must include:

- Reference to the related issue (`Closes #N`)
- What was implemented (bullet points)
- How to test it (step by step)
- Confirmation that tests pass

---

## README Structure

The `README.md` is the source of truth for the service's CURRENT state:

- Version
- Implemented functionality (checklist)
- Pending items
- How to run locally
- How to run tests

---

## Project-Specific Rules

- This is a **demo project**, not production. Prioritize speed and clarity over scalability.
- No authentication needed — single tenant, open access assumed.
- SQLite only — no PostgreSQL, no Redis, no external databases.
- Simulated channels only — no real WhatsApp/Meta/Twilio integrations.
- Stack: Next.js 15 (App Router) + Tailwind + shadcn/ui + Prisma + SQLite + Claude API (Anthropic).
