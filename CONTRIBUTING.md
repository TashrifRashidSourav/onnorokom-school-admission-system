# Contributing

This project follows GitHub Flow with a protected `main`. The full plan is in [PLAN.md](PLAN.md); these are the rules.

## 1. Every change starts as an issue

Open an issue (feature or bug template) with clear "done when" criteria, a label (`backend`, `frontend`, `infra`, `docs`, `test`, `bonus`, `bug`) and a milestone.

## 2. One issue = one branch = one pull request

```bash
git switch main && git pull
git switch -c <type>/<issue#>-<short-description>
```

| Type | Use for | Example |
|---|---|---|
| `feat` | New behaviour | `feat/9-hold-create` |
| `fix` | Bug fix | `fix/24-confirm-idempotency` |
| `test` | Tests only | `test/13-concurrency-test` |
| `docs` | Documentation only | `docs/23-docs-foundation` |
| `chore` | Tooling, setup, Docker | `chore/4-docker-compose` |
| `ci` | GitHub Actions | `ci/5-github-actions` |
| `refactor` | No behaviour change | `refactor/30-extract-seat-query` |

Backend and frontend changes go in separate branches.

## 3. Commits

[Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): imperative summary, 72 chars max

Why the change was needed, if not obvious.

Refs #N
```

Scopes: `api`, `db`, `tests`, `web`, `docker`, `ci`, `repo`, `docs`.

- One logical change per commit; if the summary needs "and", split it.
- The project builds after every commit.
- Tests go in the same commit as the code they cover, or the one right after.
- Stage deliberately (`git add -p` or explicit paths). Review every AI-generated diff before committing.
- Never: `update`, `fix`, `wip`, `changes`, `final`.

## 4. Pull requests

- Fill in the template: what, why, how it was tested, `Closes #N`.
- Title in commit form, e.g. `feat(api): seat hold endpoint with row locking (#9)`.
- CI must be green; self-review the diff on GitHub.
- Merge with **"Create a merge commit"** (squash and rebase are disabled) so individual commits stay in history. The branch is deleted automatically.

## 5. Releases

- `v0.1.0`: backend complete (milestone M1)
- `v0.2.0`: frontend complete (milestone M2)
- `v1.0.0`: final submitted version
