# SmartHire

Core recruitment platform: job and candidate management with a job posting lifecycle. Built as a
layered, async Node.js service backed by PostgreSQL.

## Project overview

SmartHire is the backend for a workforce orchestration and recruitment product. This service provides
the foundational domain:

- **Jobs** — create, update, list/search, and move through a posting lifecycle (`draft → published → closed`, with `reopen`).
- **Candidates** — register and manage candidate profiles with skills and experience.

The design deliberately keeps HTTP, business logic, and persistence in separate layers so the domain
services can later be reused by orchestration workflows and background workers without change.

## Architecture

```
                       ┌─────────────────────────────────────────────┐
   HTTP request  ─────▶│  Router      (Express; routing only)         │
                       │     │                                        │
                       │     ▼                                        │
                       │  Controller  (request/response shaping,      │
                       │     │         DTO validation)                │
                       │     ▼                                        │
                       │  Service     (business rules; throws         │
                       │     │         domain errors, no HTTP)        │
                       │     ▼                                        │
                       │  Repository  (TypeORM entities)              │
                       └─────┼────────────────────────────────────────┘
                             ▼
                         PostgreSQL   (constraints enforce invariants)
```

Cross-cutting middleware wraps every request: a request-id/context layer, and a terminal error handler
that maps domain errors to a single response envelope.

### Container topology

```
┌──────┐ healthy  ┌──────────┐ completed  ┌──────┐
│  db  │─────────▶│ migrate  │───────────▶│ api  │
└──────┘          └──────────┘            └──────┘
 postgres:17      runs migrations,        express + typeorm
                  then exits              serves HTTP
```

`docker compose` enforces the ordering: the database must be healthy before migrations run, and
migrations must complete successfully before the API starts accepting traffic.

## Setup instructions

Prerequisites: Docker + Docker Compose, and Node.js 20+ on the host.

> The backend is built on the host and the image copies the compiled output. This is a deliberate
> workaround for environments behind TLS inspection, where installing packages inside the Docker build
> fails. See the tradeoffs table in [`docs/TECHNICAL.md`](docs/TECHNICAL.md).

```bash
cp backend/.env.example backend/.env      # optional; compose has sane defaults

cd backend
npm install
npm run build
cd ..

docker compose up --build
```

- API: http://localhost:8000
- Interactive API docs: http://localhost:8000/docs
- OpenAPI JSON: http://localhost:8000/openapi.json
- Database: localhost:5432

### Seed demo data

With the stack running, populate demo jobs and candidates through the API:

```bash
cd backend
npm run seed            # targets http://localhost:8000 by default
# or: SEED_BASE_URL=http://localhost:8000 npm run seed
```

The script is safe to re-run: existing candidates are reported as already present rather than
failing the run.

### Local development (without full compose)

```bash
cd backend
npm install
# point DB_HOST at a reachable Postgres, then:
npm run migration:run
npm run dev
```

## API overview

Base URL: `http://localhost:8000`. Full schemas are at `/docs`.

### Jobs

| Method | Path | Description |
|---|---|---|
| POST | `/jobs` | Create a job (always starts as `draft`) |
| GET | `/jobs` | List/search — filters: `status`, `skill`, `title`; pagination: `limit`, `offset` |
| GET | `/jobs/{id}` | Get a job |
| PATCH | `/jobs/{id}` | Update a job (rejected when `closed`) |
| POST | `/jobs/{id}/publish` | `draft → published` |
| POST | `/jobs/{id}/close` | `→ closed` |
| POST | `/jobs/{id}/reopen` | `closed → draft` |
| DELETE | `/jobs/{id}` | Delete a job |

### Candidates

| Method | Path | Description |
|---|---|---|
| POST | `/candidates` | Register a candidate (unique email) |
| GET | `/candidates` | List/search — filters: `skill`, `name`, `minExperience`; pagination |
| GET | `/candidates/{id}` | Get a candidate |
| PATCH | `/candidates/{id}` | Update a candidate (email is immutable) |
| DELETE | `/candidates/{id}` | Delete a candidate |

### Platform

| Method | Path | Description |
|---|---|---|
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe (checks database) |
| GET | `/docs` | Swagger UI |

### Error envelope

Every failure returns a consistent shape, carrying the request id for tracing:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Job 123 not found",
    "requestId": "0f8c…"
  }
}
```

Validation failures (`422`) additionally include a `details` map of field → messages.

## Tech stack explanation

| Technology | Role |
|---|---|
| **Node.js + Express + TypeScript** | HTTP API and routing; TypeScript for a typed domain and safer refactors |
| **TypeORM** | Entity mapping and reversible migrations; native support for Postgres arrays |
| **PostgreSQL 17** | Source of truth. Constraints (unique, check, native enums) enforce invariants at the data layer, not just in application code |
| **class-validator / class-transformer** | Declarative DTO validation at the boundary; strips unknown fields so clients cannot set server-controlled values |
| **pino** | Structured, request-scoped logging |
| **swagger-ui-express** | Interactive OpenAPI documentation at `/docs` |
| **Docker + Docker Compose** | Reproducible one-command environment with ordered startup |
| **Jest + Supertest** | Integration tests against a real PostgreSQL instance |

## Testing

```bash
# start a database, then run the suite against it
docker compose up -d db
cd backend
DB_HOST=localhost npm run migration:run
DB_HOST=localhost npm test
```

Tests exercise the full stack (HTTP → service → real Postgres), including constraint-backed behavior
(unique email, native enums, GIN skill filters).
