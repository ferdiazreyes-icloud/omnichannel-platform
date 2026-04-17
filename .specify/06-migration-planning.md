# 06 — Migration Planning (TOGAF ADM: Phase F)

> This file is ONLY created when the project replaces or migrates from an existing system.

## Current State (As-Is)

- **System being replaced:** [Name and brief description]
- **Why it's being replaced:** [Key reasons]
- **What works well today:** [Things to preserve or replicate]
- **What doesn't work:** [Pain points driving the migration]

## Target State (To-Be)

[Brief description of the end state after migration is complete]

## Migration Strategy

| Approach | Description |
|---|---|
| **Big bang** | Everything switches at once on a specific date |
| **Phased** | Migrate module by module, both systems coexist temporarily |
| **Parallel run** | New system runs alongside old system for validation period |

**Chosen approach:** [Which one and why]

## Migration Phases

| Phase | What migrates | Timeline | Rollback plan |
|---|---|---|---|
| 1 | [e.g., "User accounts and auth"] | [e.g., "Week 1-2"] | [e.g., "Revert to old auth, data preserved"] |
| 2 | [e.g., "Historical data"] | | |
| 3 | [e.g., "Active workflows"] | | |

## Data Migration

- **Data to migrate:** [What data moves from old to new system]
- **Data format changes:** [Any transformations needed]
- **Validation:** [How to verify data integrity after migration]

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| [e.g., "Data loss during migration"] | High | [e.g., "Full backup before each phase, dry-run first"] |
| | | |
