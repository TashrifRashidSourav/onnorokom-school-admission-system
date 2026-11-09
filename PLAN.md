# School Admission System: Project Plan

Deadline: **11 November 2026, 11:59:59 PM**. Submit the public GitHub repo link through the form given in the brief.

Stack: .NET 8 + PostgreSQL + React 18 (Vite, TypeScript) + Docker.

Repository: **https://github.com/TashrifRashidSourav/onnorokom-school-admission-system** (public).

---

## 1. Repository layout

```
/
├─ backend/                 # .NET 8 solution
│  ├─ src/Admission.Api/    # Web API
│  ├─ tests/Admission.Tests/# xUnit tests
│  └─ Dockerfile
├─ frontend/                # Vite + React + TS
│  ├─ src/
│  └─ Dockerfile            # build -> nginx, runtime config.js
├─ docker-compose.yml
├─ .github/
│  ├─ workflows/ci.yml
│  ├─ pull_request_template.md
│  └─ ISSUE_TEMPLATE/ (feature.md, bug.md)
├─ README.md  ASSUMPTIONS.md  AI_USAGE.md  PLAN.md
└─ .gitignore  .gitattributes  .editorconfig  .env.example
```

- **Do not commit the assignment PDF.** The brief forbids making it public. `*.pdf` is in `.gitignore`.
- Do not commit `.env`, `bin/`, `obj/`, `node_modules/` or `dist/`. Commit only `.env.example`.
- Backend and frontend are fully separate: own folder, own Dockerfile, own CI job, own branches and PRs. No PR touches both, except the final docs and compose wiring.

---

## 2. Git workflow (software-engineering rules)

### 2.1 Branching: GitHub Flow with a protected `main`

- `main` always builds and runs with `docker compose up`. Nobody pushes to it directly.
- Every issue gets **its own short-lived branch** from the latest `main`, merged through a **PR**, even when working alone.
- **One branch = one issue = one PR.** Backend and frontend work are never mixed in one branch.
- Merge with a **merge commit** (`gh pr merge --merge`), never squash. Squashing would erase the commit history the assignment asks for.
- Delete the branch after the merge (local and remote).
- Before starting the next branch: `git switch main && git pull`.

**Branch naming:** `<type>/<issue#>-<short-kebab-description>`

| Good | Bad |
|---|---|
| `feat/9-hold-create` | `new-branch`, `test2`, `sourav-work` |
| `fix/24-confirm-idempotency` | `fix` |
| `test/13-concurrency-test` | `final-final` |
| `chore/4-docker-compose` | `changes` |
| `docs/21-final-docs` | |

Types: `feat`, `fix`, `test`, `docs`, `chore`, `refactor`, `ci`.

### 2.2 Branch protection on `main`

Set once, right after the first push:

- Require a pull request before merging (0 approvals, since this is a solo project).
- Require the CI status checks (`backend`, `frontend`) to pass, once CI exists (issue 5).
- Block force-pushes and branch deletion.

### 2.3 Commits: small, atomic, meaningful

Format (Conventional Commits): `type(scope): imperative summary` (72 characters or fewer), a blank line, then a body explaining **why** when it isn't obvious.

Scopes: `api`, `db`, `tests` (backend) · `web` (frontend) · `docker`, `ci`, `repo` (infra) · `docs`.

```
feat(api): lock class row when creating a hold

SELECT ... FOR UPDATE on the class serialises hold creation across
requests and across backend processes, so held + confirmed can never
exceed totalSeats.

Refs #9
```

Rules:

1. One logical change per commit. If the summary needs "and", split it.
2. The code builds after every commit.
3. A test goes in the same commit as the code it covers, or the commit right after it.
4. Stage with `git add -p` or explicit paths. Never `git add .` on AI-generated output.
5. Read every AI-generated diff before committing it, and split it into logical commits.
6. Never use messages like `update`, `fix`, `wip`, `changes` or `final`.
7. Reference the issue in the body (`Refs #N`); the PR closes it (`Closes #N`).
8. Commit as the work happens. Target about 60-80 commits in total.
9. Git identity: `TashrifRashidSourav <tashrifrashid.sourav@gmail.com>`.

### 2.4 Pull requests

Every PR follows `.github/pull_request_template.md`:

- **What** changed, **why**, **how it was tested**, `Closes #N`.
- Title in Conventional Commit form, for example `feat(api): seat hold endpoint with row locking (#9)`.
- Labels and milestone match the issue.
- Self-review the diff on GitHub before merging. CI must be green.

Lifecycle of one issue:

```
git switch main && git pull
git switch -c feat/9-hold-create
# work -> several small commits
git push -u origin feat/9-hold-create
gh pr create --fill-first --label backend --milestone "M1 Backend"
# CI green, self-review
gh pr merge --merge --delete-branch
git switch main && git pull
```

### 2.5 Issues, labels, milestones, releases

- **Labels:** `backend`, `frontend`, `infra`, `docs`, `test`, `bonus`.
- **Milestones:** `M1 Backend`, `M2 Frontend`, `M3 Bonus & Docs`.
- All issues in section 4 are created up front.
- **Tags/releases:** `v0.1.0` when M1 closes (backend complete), `v0.2.0` when M2 closes (frontend complete), `v1.0.0` on the final submitted commit, with GitHub release notes.
- **Stop pushing after the final check.** The repo is evaluated as it stands at the deadline.

---

## 3. Technical design

### Backend: .NET 8, EF Core + Npgsql

**Tables**

- `classes(id, name, total_seats, created_at)`
- `holds(id, class_id, student_id, status, created_at, expires_at, confirmed_at)`

**Concurrency core.** Correctness must hold even with two backend processes on one DB (bonus), so the database does the locking, not C# locks.

`POST /classes/{id}/holds` runs in one transaction:

1. `SELECT ... FROM classes WHERE id=@id FOR UPDATE` serialises holds for that class across processes.
2. Mark that class's stale holds `EXPIRED` (`expires_at <= now()` and status `HELD`).
3. If the student already has an active `HELD` or `CONFIRMED` hold for the class, return 409.
4. Count `HELD` + `CONFIRMED`. If that is `>= total_seats`, return 409. Otherwise insert the hold.

- **Defence in depth:** partial unique index on `(class_id, student_id) WHERE status IN ('HELD','CONFIRMED')`.
- **One clock:** use the DB `now()`, never app time, so processes cannot disagree.
- **Auto-release:** seat counts only count holds with `expires_at > now()`, so seats free the instant a hold expires. A `BackgroundService` sweeper also persists `EXPIRED` periodically.
- **Confirm is idempotent:** lock the row. If already `CONFIRMED` by the same student, return 200 without incrementing. If expired, cancelled or owned by someone else, return an error.
- **Expiry is computed on every read:** `GET /holds/{id}`, `GET /me/holds`, confirm and cancel treat a `HELD` row with `expires_at <= now()` as `EXPIRED` (and persist it). Correctness never waits for the sweeper.
- **Unique-index race:** two simultaneous holds by the same student can make the second insert violate the partial unique index. Catch Postgres `23505` and return 409, never 500.
- **Persistence:** named Postgres volume. Apply EF migrations on startup, with a DB-ready retry.

**Input validation (rule 7: 4xx, never 500)**

| Case | Response |
|---|---|
| Malformed JSON body | 400 |
| `name` empty/whitespace, `totalSeats` missing or `<= 0` | 400 |
| `X-Student-Id` missing or not exactly 17 digits | 400 |
| Unknown or badly formatted `classId` / `holdId` | 404 |
| No seats left, or student already holds/confirmed this class | 409 |
| Confirm/cancel someone else's hold | 403 |
| Confirm an expired or cancelled hold; cancel a non-`HELD` hold | 409 |

- Errors use one JSON shape: `{ "error": "<code>", "message": "<human text>" }`. The frontend maps `code` to plain language.
- A global exception handler turns anything unexpected into a JSON error and logs it. It is a safety net, not the main path.

**Contract field names (exact)**

- Class responses: `id, name, totalSeats` (+ `heldSeats, confirmedSeats, availableSeats` on GET).
- Hold responses use `holdId`, not `id`: create returns `holdId, classId, studentId, status, expiresAt`; GET returns `holdId, classId, status, expiresAt`; confirm returns `holdId, status`; `/me/holds` items add `className`.
- `expiresAt` is ISO-8601 UTC with `Z`. Statuses are upper-case `HELD | CONFIRMED | EXPIRED | CANCELLED`.
- DELETE returns 204 with no body.

### Frontend: Vite + React + TypeScript

- TanStack Query with `refetchInterval` (about 3-5s) for live seat counts and hold status.
- Countdown timer that flips locally to EXPIRED and disables "Pay" at zero.
- Student ID in a top-bar input, saved to `localStorage`, validated as 17 digits.
- Global error banner mapping API errors to plain-language messages, including "server unreachable".
- Vitest + React Testing Library (bonus).

### Docker

- Compose has 3 services: `db` (healthcheck + volume), `backend` (waits for DB, port 8080), `frontend` (nginx serving the build).
- Backend config via `ConnectionStrings__Default` and `HOLD_DURATION_SECONDS` (default 600).
- Frontend backend-URL: **runtime** `config.js` written by the container entrypoint from `API_URL`, because plain Vite bakes env vars at build time.
- CORS enabled on the backend.
- Tests run through a compose `test` profile so Docker stays the only requirement. The test container connects to a **separate `db-test` Postgres service** (no Testcontainers, so no Docker socket mount is needed). Command: `docker compose --profile test run --rm backend-tests`.
- **Bonus multi-process:** a `backend2` service on port 8081 under a `multi` profile, sharing the same DB. A test fires parallel holds at both ports and asserts `held + confirmed <= totalSeats`.

### CI (GitHub Actions)

- `backend` job: `dotnet build` + `dotnet test` against a Postgres service container.
- `frontend` job: `npm ci`, `npm run lint`, `npm run build`, `npm test` (once tests exist).
- Runs on every PR and on push to `main`. Both jobs are required checks for merging.

---

## 4. Issues, branches and planned commits

Each row is one issue → one branch → one PR. The commit list is the plan; real commits may split further, never merge together.

### M1 Backend (+ shared infra)

| # | Branch | Label | Planned commits |
|---|---|---|---|
| 1 | `chore/1-repo-scaffold` | infra | `chore(repo): add gitignore, gitattributes and editorconfig` · `chore(repo): add PR and issue templates` · `docs: add project plan` · `chore(repo): add env example` |
| 2 | `chore/2-backend-skeleton` | backend | `chore(api): create .NET 8 solution and API project` · `chore(tests): add xUnit test project` · `feat(api): add health endpoint` · `chore(docker): add backend Dockerfile` |
| 3 | `chore/3-frontend-skeleton` | frontend | `chore(web): scaffold Vite React TypeScript app` · `chore(web): add runtime config.js for API URL` · `chore(docker): add frontend Dockerfile with nginx` |
| 4 | `chore/4-docker-compose` | infra | `chore(docker): add compose with postgres, backend, frontend` · `chore(docker): add db healthcheck and named volume` · `chore(docker): add test profile with db-test` |
| 5 | `ci/5-github-actions` | infra | `ci: build and test backend on pull requests` · `ci: build and lint frontend on pull requests` |
| 6 | `feat/6-data-model` | backend | `feat(db): add Class and Hold entities and DbContext` · `feat(db): add initial migration with partial unique index` · `feat(db): apply migrations on startup with retry` |
| 7 | `feat/7-validation-errors` | backend | `feat(api): add uniform JSON error response` · `feat(api): validate X-Student-Id header` · `feat(api): return 400 for malformed JSON` · `feat(api): add global exception handler` |
| 8 | `feat/8-class-endpoints` | backend | `feat(api): add POST /classes` · `feat(api): add GET /classes with seat counts` · `feat(api): add GET /classes/{id}` · `test(api): cover class endpoints and validation` |
| 9 | `feat/9-hold-create` | backend | `feat(api): add POST /classes/{id}/holds` · `feat(api): lock class row when creating a hold` · `feat(api): map unique violation to 409` · `test(api): cover hold creation rules` |
| 10 | `feat/10-hold-read-cancel` | backend | `feat(api): add GET /holds/{id}` · `feat(api): add DELETE /holds/{id}` · `feat(api): add GET /me/holds` · `test(api): cover hold read, cancel and ownership` |
| 11 | `feat/11-hold-confirm` | backend | `feat(api): add POST /holds/{id}/confirm` · `feat(api): make confirm idempotent` · `test(api): confirm twice counts one seat` |
| 12 | `feat/12-hold-expiry` | backend | `feat(api): read hold duration from HOLD_DURATION_SECONDS` · `feat(api): treat past-due holds as expired on read` · `feat(api): add background expiry sweeper` · `test(api): expired hold frees seat and cannot be confirmed` |
| 13 | `test/13-concurrency-test` | backend, test | `test(api): 200 parallel holds on a 10-seat class` · `test(api): parallel duplicate holds by one student` |

→ Close M1, tag **`v0.1.0`**.

### M2 Frontend

| # | Branch | Label | Planned commits |
|---|---|---|---|
| 14 | `feat/14-web-api-client` | frontend | `feat(web): add typed API client` · `feat(web): add TanStack Query provider` · `feat(web): add student ID bar persisted in localStorage` · `feat(web): add app layout and navigation` |
| 15 | `feat/15-web-class-screens` | frontend | `feat(web): add create-class form` · `feat(web): add class list with live seat counts` · `feat(web): add apply button on class list` |
| 16 | `feat/16-web-application-screen` | frontend | `feat(web): add application screen` · `feat(web): add expiry countdown` · `feat(web): add pay and cancel actions` |
| 17 | `feat/17-web-my-applications` | frontend | `feat(web): add my applications list` · `feat(web): poll hold status without reload` |
| 18 | `feat/18-web-error-handling` | frontend | `feat(web): map API error codes to plain-language messages` · `feat(web): show server-unreachable banner` · `feat(web): add error boundary` |

→ Close M2, tag **`v0.2.0`**.

### M3 Bonus & Docs

| # | Branch | Label | Planned commits |
|---|---|---|---|
| 19 | `test/19-web-tests` | frontend, test, bonus | `test(web): set up Vitest and Testing Library` · `test(web): cover student ID validation` · `test(web): cover countdown expiry and disabled pay` |
| 20 | `test/20-multi-instance` | backend, test, bonus | `chore(docker): add backend2 on 8081 under multi profile` · `test(api): parallel holds across two processes` |
| 21 | `docs/21-final-docs` | docs | `docs: add README with run and test steps` · `docs: add ASSUMPTIONS` · `docs: add AI_USAGE` |

→ Final check, tag **`v1.0.0`**, submit.

Bugs found along the way get their own issue and a `fix/<#>-...` branch, never a silent edit inside another feature branch.

### Required backend tests

- Concurrency: 200 parallel holds (200 distinct student IDs) on a 10-seat class. Exactly 10 get 201, 190 get 409, and `held + confirmed <= total`.
- Confirm twice. `confirmedSeats` is 1.
- Expired hold cannot be confirmed (run with `HOLD_DURATION_SECONDS=1`). Its seat is available again without any API call.
- Same student cannot hold the same class twice, including when both requests arrive in parallel (409, not 500).
- A different student cannot confirm or cancel the hold (403).
- Invalid input returns 400/404 (bad JSON, bad `totalSeats`, bad `X-Student-Id`, unknown IDs).

---

## 5. Schedule

Revised on Mon 9 Nov: nothing from Sunday was done, so the schedule is compressed. Bonus items are cut first if time runs short.

| Day | Goal |
|---|---|
| **Mon 9 Nov** | Issues 1-13: repo, skeletons, compose, CI, all 8 endpoints with validation and locking, expiry, concurrency tests. **End of day: backend complete, tag `v0.1.0`.** |
| **Tue 10 Nov** | Issues 14-18: full frontend. Tag `v0.2.0`. Then issue 21 docs draft. |
| **Wed 11 Nov** | Issues 19-20 (bonus) in the morning. Then fresh `git clone`, `docker compose down -v && up`, click through every UI rule, tag `v1.0.0`, submit by about 6 PM. Do not leave submission to 11:59 PM. |

---

## 6. Docs, kept as you go

- **ASSUMPTIONS.md:** add each assumption in the same PR as the code it explains.
  - 17-digit student ID validation (digits only).
  - Missing or invalid `X-Student-Id` returns 400.
  - Re-applying after cancel or expiry is allowed.
  - Confirm or cancel by a different student returns 403.
  - Duplicate hold and no-seats both return 409, told apart by the `error` code.
  - Confirming an expired/cancelled hold, or cancelling a non-`HELD` hold, returns 409.
  - Cancelling a `CONFIRMED` admission is not allowed (no refunds in scope).
  - `GET /holds/{id}` needs no `X-Student-Id` (the contract does not list it).
  - Seat counts exclude expired holds; expiry is computed on read, the sweeper only persists it.
  - ID format (GUID with a prefix).
  - How multi-process safety works (the row lock, DB clock, unique index) and how it was checked (`backend2` on 8081).
- **AI_USAGE.md:** keep a running note from day 1: which tool, which parts, where the AI was wrong, how you caught it.
- **README.md:** `docker compose up`, the frontend URL, and the exact test command. Verify the README on a clean clone.

---

## 7. Final checklist before tagging `v1.0.0`

- [ ] Clean clone, then `docker compose up` starts everything with no other installs.
- [ ] `down` then `up` keeps the data.
- [ ] All 8 endpoints match the contract field for field (`holdId`, not `id`, on hold responses).
- [ ] No input produces a 500 (bad JSON, bad header, bad IDs, parallel duplicate holds).
- [ ] A hold shows EXPIRED the moment it expires, even before the sweeper runs.
- [ ] UI works without reload: expiry, seat counts, refresh persistence.
- [ ] Every error shows a human-readable message.
- [ ] `docker compose --profile test run --rm backend-tests` passes from a clean clone.
- [ ] CI is green on `main`.
- [ ] No secrets or PDF in the repo.
- [ ] Every change reached `main` through a PR; every branch and commit name follows section 2.
- [ ] Repo is public.
