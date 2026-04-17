# 05 — Opportunities & Solutions (TOGAF ADM: Phase E)

## Decisions Log

Key technical and strategic decisions made for this project.

### Decision 1: [Title]

- **Context:** [What problem or question prompted this decision?]
- **Options evaluated:**
  | Option | Pros | Cons |
  |---|---|---|
  | [e.g., "Supabase"] | [e.g., "Hosted, auth included, fast setup"] | [e.g., "Vendor lock-in, less control"] |
  | [e.g., "PostgreSQL + Docker"] | [e.g., "Full control, portable"] | [e.g., "More setup, manage own auth"] |
- **Decision:** [What was chosen and why]
- **Consequences:** [What does this imply for the rest of the project?]

### Decision 2: [Title]

- **Context:**
- **Options evaluated:**
- **Decision:**
- **Consequences:**

## Build vs Buy vs Reuse

| Capability | Approach | Solution | Rationale |
|---|---|---|---|
| [e.g., "Authentication"] | Buy | [e.g., "Auth0"] | [e.g., "Not core to our value, saves 2 weeks"] |
| [e.g., "Document processing"] | Build | [e.g., "Custom Python service"] | [e.g., "Core business logic, no good alternatives"] |
| [e.g., "UI components"] | Reuse | [e.g., "shadcn/ui"] | [e.g., "Open source, customizable, good defaults"] |

## Dependencies & Risks

| Dependency / Risk | Impact | Mitigation |
|---|---|---|
| [e.g., "External API has 99% SLA"] | [e.g., "Service degrades if API is down"] | [e.g., "Cache responses, retry with backoff"] |
| | | |

## Work Packages

| Package | Description | Dependencies | Priority |
|---|---|---|---|
| [e.g., "Auth setup"] | [e.g., "Configure Auth0 + JWT middleware"] | None | High |
| [e.g., "Supplier CRUD"] | [e.g., "API + UI for supplier management"] | Auth setup | High |
| | | | |
