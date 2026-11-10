# Onnorokom School Admission System

Online admission system for a school where seats are given **first-come, first-served** (no lottery).
Applying holds a seat for a limited time; paying the admission fee within that time confirms it.
If the time runs out, the seat is released automatically for the next applicant.

| | |
|---|---|
| **Backend** | .NET 8 Web API, EF Core, PostgreSQL (`backend/`) |
| **Frontend** | React 19, MUI 7, Vite, TypeScript, TanStack Query (`frontend/`) |
| **Runtime** | Docker Compose — Docker is the only thing you need to install |

> **Status:** in development. Sections marked _(pending #N)_ are filled in by the PR that closes issue N.

---

## Quick start

Only [Docker](https://docs.docker.com/get-docker/) (with Compose v2) is required.

```bash
git clone https://github.com/TashrifRashidSourav/onnorokom-school-admission-system.git
cd onnorokom-school-admission-system
docker compose up --build
```

The first build takes a few minutes. When the logs settle, open:

| Service | URL |
|---|---|
| **Frontend** | **http://localhost:3000** |
| Backend API | http://localhost:8080 (health check: `/health`) |
| PostgreSQL | `localhost:5432`, database/user/password `admission` (inside compose: `db:5432`) |

The backend starts only after PostgreSQL reports healthy.

### Using the app

The frontend has two areas. No login is needed for either.

| Area | URL | Who | What you can do |
|---|---|---|---|
| **Parent portal** | http://localhost:3000 | Parents | Enter the student's 17-digit birth registration number in the header, see classes and free seats, apply, pay before the hold expires, cancel, and see all applications under **My applications** |
| **Admin console** | http://localhost:3000/admin | School staff | See every class with its seat counts and create a class with **New class** |

The parent portal footer has a link to the admin console, and the console has a **View parent site** button to go back.

| Command | Effect |
|---|---|
| `docker compose up -d --build` | Start in the background |
| `docker compose logs -f backend` | Follow backend logs |
| `docker compose down` | Stop. Data is kept in the `pgdata` volume and is still there after the next `up` |
| `docker compose down -v` | Stop **and delete all data** |

## Configuration

All settings come from environment variables with defaults in `docker-compose.yml`, so no `.env` file is needed. To change something, copy [`.env.example`](.env.example) to `.env` and edit it.

| Variable | Default | Purpose |
|---|---|---|
| `HOLD_DURATION_SECONDS` | `600` | How long a seat stays held before it expires |
| `API_URL` | `http://localhost:8080` | Backend URL the browser uses; written into `config.js` when the frontend container starts, so no rebuild is needed |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | `admission` | Database settings; the backend's connection string (`ConnectionStrings__Default`) is built from them |
| `FRONTEND_PORT` / `BACKEND_PORT` / `DB_PORT` | `3000` / `8080` / `5432` | Host ports, in case one is already in use |

Example: `HOLD_DURATION_SECONDS=30 docker compose up -d` makes holds expire after 30 seconds, which is handy for trying out expiry.

## Running the tests

_(pending #13, #19)_

```bash
# Backend tests, including the concurrency test (uses its own test database)
docker compose --profile test run --rm backend-tests

# Frontend tests (bonus)
docker compose --profile test run --rm frontend-tests
```

## How it works

```mermaid
flowchart LR
  B[Browser<br/>React UI] -- "JSON + X-Student-Id" --> A[ASP.NET Core API :8080]
  A -- "SELECT ... FOR UPDATE<br/>per class" --> D[(PostgreSQL)]
  S[Expiry sweeper<br/>BackgroundService] --> D
```

Hold lifecycle:

```mermaid
stateDiagram-v2
  [*] --> HELD: apply (seat available)
  HELD --> CONFIRMED: pay fee before expiry
  HELD --> CANCELLED: cancel
  HELD --> EXPIRED: time runs out
  CONFIRMED --> [*]
  CANCELLED --> [*]
  EXPIRED --> [*]
```

- **No overbooking:** creating a hold locks the class row in PostgreSQL, so `held + confirmed` can never exceed `totalSeats`, even with several backend processes on one database.
- **Automatic release:** an expired hold stops counting the moment its time is up; nobody has to call an API.
- **Idempotent payment:** confirming the same hold twice counts the seat once.

Details and the reasoning behind each decision are in [ASSUMPTIONS.md](ASSUMPTIONS.md).

## API

Base URL `http://localhost:8080`. All requests and responses are JSON. The student is identified by the `X-Student-Id` header (17-digit birth registration number).

| # | Method | Path | Purpose | Success |
|---|---|---|---|---|
| 1 | `POST` | `/classes` | Create a class (one shift = one class) | `201` |
| 2 | `GET` | `/classes` | List classes with seat counts | `200` |
| 3 | `GET` | `/classes/{classId}` | Seat counts for one class | `200` |
| 4 | `POST` | `/classes/{classId}/holds` | Apply (hold a seat) | `201`, `409` if full |
| 5 | `GET` | `/holds/{holdId}` | Current status of an application | `200` |
| 6 | `POST` | `/holds/{holdId}/confirm` | Pay the fee, confirm admission | `200` |
| 7 | `DELETE` | `/holds/{holdId}` | Cancel an application | `204` |
| 8 | `GET` | `/me/holds` | All applications of this student | `200` |

Errors always look like `{ "error": "<code>", "message": "<explanation>" }`. Invalid input returns `4xx`, never `500`.

## Project structure

```
backend/     .NET 8 solution: src/Admission.Api, tests/Admission.Tests, Dockerfile
frontend/    React + Vite app, Dockerfile (nginx + runtime config)
docker-compose.yml
```

## Documentation

- [ASSUMPTIONS.md](ASSUMPTIONS.md): decisions where the brief left room
- [AI_USAGE.md](AI_USAGE.md): which AI tools were used, where, and what they got wrong
- [CONTRIBUTING.md](CONTRIBUTING.md): branch, commit and pull-request rules
- [PLAN.md](PLAN.md): design and issue-by-issue plan
