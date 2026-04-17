# 04 — Technology Architecture (TOGAF ADM: Phase D)

## Technology Stack

| Layer | Technology | Version | Justification |
|---|---|---|---|
| **Language** | [e.g., "Python 3.12"] | | [e.g., "Team expertise, AI ecosystem"] |
| **Framework** | [e.g., "FastAPI"] | | [e.g., "Async, auto-docs, type safety"] |
| **Database** | [e.g., "PostgreSQL 16"] | | [e.g., "Relational data, ACID compliance"] |
| **Frontend** | [e.g., "React + Next.js"] | | [e.g., "SSR, ecosystem, component reuse"] |
| **ORM** | [e.g., "SQLAlchemy"] | | |
| **Testing** | [e.g., "pytest"] | | |
| **Containerization** | [e.g., "Docker"] | | |
| **CI/CD** | [e.g., "GitHub Actions"] | | |
| **Monitoring** | [e.g., "Sentry"] | | |
| **Hosting** | [e.g., "Railway"] | | [e.g., "Simple deploys, free tier for MVP"] |

## Infrastructure

### Environments

| Environment | Purpose | URL/Location |
|---|---|---|
| Local | Development | `localhost` |
| Staging | Pre-production testing | [TBD] |
| Production | Live | [TBD] |

### Deployment

[How is the project deployed? Docker compose? CI/CD pipeline? Manual?]

## Security Architecture

- **Authentication:** [e.g., "JWT tokens via Auth0"]
- **Authorization:** [e.g., "Role-based: admin, supplier, viewer"]
- **Secrets management:** [e.g., ".env locally, Railway env vars in prod"]
- **HTTPS:** [e.g., "Enforced in all environments"]
