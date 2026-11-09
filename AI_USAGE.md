# AI Usage

The brief allows AI tools. This file records which ones I used, for what, where they were wrong, and how I caught it. It is updated as the project goes on.

## Tools

| Tool | Used for |
|---|---|
| Claude Code (Claude Opus 5.5) in VS Code | Reading the brief, drafting the plan, setting up the dev machine and GitHub repo, drafting docs. Code generation will be logged below as it happens. |

## How I use it

- I read every AI-generated diff before committing it, and split it into small commits myself.
- I checked the plan against the brief line by line instead of trusting the AI's summary.
- Behaviour that matters (no overbooking, expiry, idempotent confirm, error codes) is covered by automated tests, not just by reading the code.

## Where the AI was wrong, and how I caught it

| # | What the AI did | How I caught it | Fix |
|---|---|---|---|
| 1 | The first plan missed parts of the brief: rule 7 (bad input must be `4xx`, never `500`), the case where two parallel requests from the same student hit the unique index and would surface as a `500`, and the case where a hold's status could still read `HELD` after its expiry time until a background job ran. | Reviewed the plan against each numbered rule in the brief. | Added a validation table, mapping of unique-index violations to `409`, and computing expiry on every read. |
| 2 | The plan's schedule assumed work had already been done on the first day that had not been started. | Compared the schedule with the actual state of the project folder. | Compressed the schedule and marked bonus items to drop first. |
| 3 | The AI added a `Co-Authored-By` line to commit messages, which made it appear as a contributor on GitHub. | Noticed it in the repository's Contributors list. | Rewrote the two affected commits and stopped adding the line. AI use is disclosed here instead. |

## Parts written mainly by AI

_(updated per pull request)_

## Parts written or substantially changed by me

_(updated per pull request)_
